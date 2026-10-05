import { RuntimeHttpError, isRetryableHttpError } from "../shared/runtime-http.client";
import { createUuid, isLocalId } from "../shared/runtime-ids";

export const DATA_BATCH_PATH = "/app-engine/data/batch";
const MAX_BATCH_SIZE = 50;
const REFERENCE_FIELDS = ["id", "parent_id", "ref_id", "acl_source_id"];
// A unique index of the app refused the write (409): not a revision conflict, so nothing to merge with.
export const DUPLICATE_ERROR_CODE = "APP_DATA_DUPLICATE";

// Outbox entries keep the client method names; the batch endpoint speaks the route names.
const BATCH_OPERATION_NAMES = {
  setKey: "set-key",
  remove: "delete",
};

const outcomeStatus = (item) => {
  if (!item) {
    return 0;
  }
  if (typeof item.status === "number") {
    return item.status;
  }
  return item.success === false ? 500 : 200;
};

// `POST /data/batch` answers `{ results: [{ index, op, client_mutation_id, status, success, message, result }] }`,
// one envelope per operation in request order. Outcomes are matched by client_mutation_id first and by
// index as a fallback.
const normalizeBatchOutcomes = (result, entries) => {
  const items = result?.results || [];

  return entries.map((entry, index) => {
    const item =
      items.find((candidate) => candidate?.client_mutation_id === entry.client_mutation_id) ||
      items.find((candidate) => candidate?.index === index);
    return {
      status: outcomeStatus(item),
      record: item?.result ?? null,
      message: item?.message || null,
    };
  });
};

const rewriteReferences = (payload, idMap) => {
  const rewritten = { ...payload };
  for (const field of REFERENCE_FIELDS) {
    if (rewritten[field] && idMap[rewritten[field]]) {
      rewritten[field] = idMap[rewritten[field]];
    }
  }
  return rewritten;
};

const hasUnresolvedReference = (entry, payload) =>
  REFERENCE_FIELDS.some((field) => isLocalId(payload[field]) && payload[field] !== entry.local_id);

export default class AppDataOutbox {
  constructor({ store, http, handlers }) {
    this._store = store;
    this._http = http;
    this._handlers = handlers;
    this._inFlight = new Set();
    this._replaying = null;
  }

  entries() {
    return this._store.getOutbox();
  }

  size() {
    return this.entries().length;
  }

  targetIds() {
    const { idMap } = this._store.getMeta();
    const ids = new Set();
    for (const entry of this.entries()) {
      ids.add(entry.target_id);
      if (idMap[entry.target_id]) {
        ids.add(idMap[entry.target_id]);
      }
    }
    return ids;
  }

  hasPending(id) {
    return this.targetIds().has(id);
  }

  isInFlight(entry) {
    return this._inFlight.has(entry.client_mutation_id);
  }

  enqueue({ op, payload, targetId, localId = null, expectedRevision = null }) {
    const entry = {
      client_mutation_id: createUuid(),
      op,
      payload,
      target_id: targetId,
      local_id: localId,
      expected_revision: expectedRevision,
    };

    const current = this.entries();
    const lastForTarget = [...current].reverse().find((candidate) => candidate.target_id === targetId);
    const canMergeInto = lastForTarget && lastForTarget.op === op && !this.isInFlight(lastForTarget);

    // Key upserts carry the full value and consecutive patches share their base revision, so both
    // collapse into the queued entry instead of producing a self-conflict on replay.
    if (canMergeInto && (op === "setKey" || op === "update")) {
      const merged = {
        ...lastForTarget,
        payload:
          op === "setKey"
            ? { ...(lastForTarget.payload.acl ? { acl: lastForTarget.payload.acl } : {}), ...payload }
            : { ...lastForTarget.payload, ...payload },
      };
      this._store.setOutbox(current.map((candidate) => (candidate === lastForTarget ? merged : candidate)));
      return merged;
    }

    this._store.setOutbox([...current, entry]);
    return entry;
  }

  // Queued entries that need a record the server refused to create: they address its local id or name it as
  // a reference, and would wait for an id that never comes.
  removeDependentsOf(localId) {
    return this.removeWhere(
      (entry) => entry.target_id === localId || REFERENCE_FIELDS.some((field) => entry.payload?.[field] === localId),
    );
  }

  removeWhere(predicate) {
    const removed = [];
    const kept = this.entries().filter((entry) => {
      if (!this.isInFlight(entry) && predicate(entry)) {
        removed.push(entry);
        return false;
      }
      return true;
    });
    this._store.setOutbox(kept);
    return removed;
  }

  #removeEntry(clientMutationId) {
    this._store.setOutbox(this.entries().filter((entry) => entry.client_mutation_id !== clientMutationId));
  }

  // Queued updates were computed against the revision the record had when they were enqueued; once
  // one of our own operations moves the record forward, they follow it.
  #rebaseFollowing(targetIds, toRevision) {
    if (typeof toRevision !== "number") {
      return;
    }
    const ids = new Set(targetIds);
    this._store.setOutbox(
      this.entries().map((entry) => {
        if (entry.op !== "update" || (!ids.has(entry.target_id) && !ids.has(entry.payload?.id))) {
          return entry;
        }
        if (entry.expected_revision === null || entry.expected_revision >= toRevision) {
          return entry;
        }
        return { ...entry, expected_revision: toRevision };
      }),
    );
  }

  #nextBatch(maxSize) {
    const { idMap } = this._store.getMeta();
    const batch = [];
    const updatedTargets = new Set();
    const patchedTargets = new Set();

    for (const entry of this.entries()) {
      if (batch.length >= maxSize) {
        break;
      }
      const payload = rewriteReferences(entry.payload, idMap);
      if (hasUnresolvedReference(entry, payload)) {
        break;
      }
      // An update must wait for the new revision of a previous update or patch of the same record.
      if (entry.op === "update" && (updatedTargets.has(payload.id) || patchedTargets.has(payload.id))) {
        break;
      }
      if (entry.op === "update") {
        updatedTargets.add(payload.id);
      }
      if (entry.op === "patch") {
        patchedTargets.add(payload.id);
      }
      batch.push({ ...entry, payload });
    }

    return batch;
  }

  replay(options = {}) {
    if (this._replaying) {
      return this._replaying;
    }
    this._replaying = this.#drain(options).finally(() => {
      this._replaying = null;
    });
    return this._replaying;
  }

  async #drain({ keepalive = false }) {
    let maxSize = MAX_BATCH_SIZE;
    let applied = 0;

    for (;;) {
      const batch = this.#nextBatch(maxSize);
      if (!batch.length) {
        return { ok: true, applied };
      }

      batch.forEach((entry) => this._inFlight.add(entry.client_mutation_id));
      let result;
      try {
        result = await this._http.request({
          method: "POST",
          path: DATA_BATCH_PATH,
          body: {
            operations: batch.map((entry) => ({
              op: BATCH_OPERATION_NAMES[entry.op] || entry.op,
              payload: {
                ...entry.payload,
                client_mutation_id: entry.client_mutation_id,
                ...(entry.expected_revision !== null ? { expected_revision: entry.expected_revision } : {}),
              },
            })),
          },
          keepalive,
        });
      } catch (error) {
        batch.forEach((entry) => this._inFlight.delete(entry.client_mutation_id));
        if (isRetryableHttpError(error) || error.status === 401) {
          return { ok: false, applied, error };
        }
        if (batch.length > 1) {
          maxSize = 1;
          continue;
        }
        await this.#settle(batch[0], { status: error.status, record: error.body?.result ?? null, message: error.message });
        continue;
      }

      const outcomes = normalizeBatchOutcomes(result, batch);
      batch.forEach((entry) => this._inFlight.delete(entry.client_mutation_id));

      for (let index = 0; index < batch.length; index += 1) {
        const settled = await this.#settle(batch[index], outcomes[index]);
        if (!settled) {
          return {
            ok: false,
            applied,
            error: new RuntimeHttpError({ status: outcomes[index].status, message: outcomes[index].message }),
          };
        }
        applied += 1;
      }
    }
  }

  async #settle(entry, outcome) {
    const { status, record } = outcome;

    if (status >= 200 && status < 300) {
      this.#removeEntry(entry.client_mutation_id);
      if (entry.op === "create" && entry.local_id && record?.id) {
        const meta = this._store.getMeta();
        this._store.updateMeta({ idMap: { ...meta.idMap, [entry.local_id]: record.id } });
        this.#rebaseFollowing([entry.local_id, record.id], record.revision);
        await this._handlers.onCreated(entry, record);
        return true;
      }
      // Entries enqueued after an offline create was mapped already address the server id.
      this.#rebaseFollowing([entry.target_id, entry.payload?.id, record?.id], record?.revision);
      await this._handlers.onApplied(entry, record);
      return true;
    }

    if (status === 409 && record?.error_code !== DUPLICATE_ERROR_CODE) {
      this.#removeEntry(entry.client_mutation_id);
      await this._handlers.onConflict(entry, record?.current ?? null);
      return true;
    }

    if (status === 0 || status === 401 || status === 408 || status === 429 || status >= 500) {
      return false;
    }

    this.#removeEntry(entry.client_mutation_id);
    await this._handlers.onRejected(entry, outcome);
    return true;
  }
}

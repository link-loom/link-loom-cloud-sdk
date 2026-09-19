import AppDataLocalStore, { buildAppDataNamespace } from "./data-local.store";
import AppDataOutbox from "./data-outbox";
import { isRetryableHttpError } from "../shared/runtime-http.client";
import { LOCAL_ID_PREFIX, createUuid, hashValue, isLocalId } from "../shared/runtime-ids";
import { applyPatchOperations, validatePatchOperations } from "./data-patch";

const DATA_PATH = "/app-engine/data";
const REPLAY_INTERVAL_MS = 30 * 1000;
const MAX_REPLAY_DELAY_MS = 5 * 60 * 1000;
const RECORD_SIGNALS = ["record.created", "record.updated", "record.deleted"];
const DEFAULT_SCOPE = "user-appdata";
const PERSONAL_SCOPE = "user";
const SIGNAL_DEDUPE_LIMIT = 50;
const FAILURE_HISTORY_LIMIT = 20;
const CHANGES_MAX_PAGES = 20;
// Changes written while the feed was being read carry timestamps just before `server_time`.
const CHANGES_OVERLAP_MS = 5 * 1000;

const RECORD_FIELD_MAP = {
  scope: "scope",
  title: "title",
  data: "data",
  tags: "tags",
  parentId: "parent_id",
  refId: "ref_id",
  startsAt: "starts_at",
  endsAt: "ends_at",
  acl: "acl",
  aclSourceId: "acl_source_id",
  searchText: "search_text",
  contentObjectId: "content_object_id",
};

const toRecordFields = (input = {}) => {
  const fields = {};
  for (const [inputKey, recordKey] of Object.entries(RECORD_FIELD_MAP)) {
    if (input[inputKey] !== undefined) {
      fields[recordKey] = input[inputKey];
    } else if (input[recordKey] !== undefined) {
      fields[recordKey] = input[recordKey];
    }
  }
  return fields;
};

const keyRecordId = (collection, scope, key, owner) => `key:${collection}:${scope}:${key}${owner ? `:${owner}` : ""}`;

const matchesCollectionQuery = (record, query) =>
  record.collection === query.collection &&
  (!query.scope || record.scope === query.scope) &&
  (!query.parent_id || record.parent_id === query.parent_id) &&
  (!query.ref_id || record.ref_id === query.ref_id);

const extractItems = (result) => result?.items || [];

const isDeletedRecord = (record) => Boolean(record?.deleted) || record?.status?.name === "deleted";

export default class AppDataClient {
  constructor({ http, appSlug, veripassIdentity, organizationId, realtime = null, storage, now = () => Date.now(), isOnline }) {
    this._http = http;
    this._appSlug = appSlug;
    this._veripassIdentity = veripassIdentity || null;
    this._organizationId = organizationId || null;
    this._realtime = realtime;
    this._now = now;
    this._isOnline = isOnline || (() => globalThis.navigator?.onLine !== false);
    this._store = new AppDataLocalStore({
      namespace: buildAppDataNamespace({ veripassIdentity, organizationId, appSlug }),
      storage,
      now,
    });
    this._outbox = new AppDataOutbox({
      store: this._store,
      http,
      handlers: {
        onCreated: (entry, record) => this.#handleCreated(entry, record),
        onApplied: (entry, record) => this.#handleApplied(entry, record),
        onConflict: (entry, current) => this.#handleConflict(entry, current),
        onRejected: (entry, outcome) => this.#handleRejected(entry, outcome),
      },
    });
    this._statusListeners = new Set();
    this._replayFailures = 0;
    this._replayTimer = null;
    this._started = false;
    this._windowListeners = [];
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  start() {
    if (this._started || typeof window === "undefined") {
      return;
    }
    this._started = true;

    const listen = (target, name, handler) => {
      target.addEventListener(name, handler);
      this._windowListeners.push(() => target.removeEventListener(name, handler));
    };

    listen(window, "online", () => this.sync());
    listen(window, "offline", () => this.#emitStatus());
    listen(window, "focus", () => this.flush());

    this._realtimeOpenUnsubscribe = this._realtime?.onReconnect(() => this.resync());
    this._store.prune(this._outbox.targetIds());
    this.#scheduleReplay(0);
  }

  dispose() {
    this._started = false;
    clearTimeout(this._replayTimer);
    this._windowListeners.forEach((remove) => remove());
    this._windowListeners = [];
    this._realtimeOpenUnsubscribe?.();
    this._statusListeners.clear();
  }

  #scheduleReplay(delayMs) {
    if (!this._started) {
      return;
    }
    clearTimeout(this._replayTimer);
    this._replayTimer = setTimeout(async () => {
      await this.flush();
      const backoff = Math.min(REPLAY_INTERVAL_MS * 2 ** this._replayFailures, MAX_REPLAY_DELAY_MS);
      this.#scheduleReplay(backoff);
    }, delayMs);
  }

  // ── Status ─────────────────────────────────────────────────────────

  status() {
    const meta = this._store.getMeta();
    const syncTimestamps = [meta.lastSyncAt, meta.lastChangesAt].filter(Boolean);
    return {
      online: this._isOnline(),
      pending: this._outbox.size(),
      lastSyncAt: syncTimestamps.length ? Math.max(...syncTimestamps) : null,
      conflicts: meta.conflicts,
      conflictIds: meta.conflictIds,
    };
  }

  // Clears the conflict counter once the app has shown the conflicts to the user.
  acknowledgeConflicts() {
    this._store.updateMeta({ conflicts: 0, conflictIds: [] });
    this.#emitStatus();
  }

  onStatusChange(callback) {
    this._statusListeners.add(callback);
    return () => this._statusListeners.delete(callback);
  }

  #emitStatus() {
    const snapshot = this.status();
    this._statusListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("[AppData] status listener failed", error);
      }
    });
  }

  #afterMutation() {
    this.#emitStatus();
    this.#scheduleReplay(0);
  }

  // ── Sync ───────────────────────────────────────────────────────────

  async flush({ keepalive = false } = {}) {
    if (!this._outbox.size()) {
      return { ok: true, applied: 0 };
    }
    if (!this._isOnline()) {
      return { ok: false, applied: 0 };
    }

    const outcome = await this._outbox.replay({ keepalive });
    this._replayFailures = outcome.ok ? 0 : this._replayFailures + 1;

    if (outcome.ok) {
      this._store.updateMeta({ lastSyncAt: this._now() });
      this._store.prune(this._outbox.targetIds());
    }

    this.#emitStatus();
    return outcome;
  }

  async sync() {
    const outcome = await this.flush();
    if (outcome.ok) {
      await this.resync();
    }
    return outcome;
  }

  // `GET /data/changes` pages oldest-first and includes soft-deleted records; purged records never appear
  // (a later 404 on their id is the purge signal). The next watermark is the server clock, not ours.
  async resync() {
    if (!this._isOnline()) {
      return;
    }

    const meta = this._store.getMeta();
    const changedCollections = new Set();
    let updatedAfter = meta.lastChangesAt || 0;
    let serverTime = null;
    let drained = false;

    for (let page = 0; page < CHANGES_MAX_PAGES && !drained; page += 1) {
      let result;
      try {
        result = await this._http.request({
          path: `${DATA_PATH}/changes`,
          query: { updated_after: updatedAfter, collections: meta.collections },
        });
      } catch (error) {
        if (isRetryableHttpError(error)) {
          return;
        }
        throw error;
      }

      serverTime = serverTime ?? Number(result?.server_time);
      const changed = extractItems(result);
      this.#applyChanges(changed);
      changed.forEach((record) => record?.collection && changedCollections.add(record.collection));

      // Resume from the last change seen; records sharing that millisecond are re-read, never skipped.
      const nextUpdatedAfter = Number(changed[changed.length - 1]?.modified?.timestamp) - 1;
      drained = changed.length < (result?.pageSize || changed.length + 1) || !(nextUpdatedAfter > updatedAfter);
      if (!drained) {
        updatedAfter = nextUpdatedAfter;
      }
    }

    this._store.removeListsForCollections([...changedCollections]);
    const watermark = drained && Number.isFinite(serverTime) ? Math.max(serverTime - CHANGES_OVERLAP_MS, 0) : updatedAfter;
    this._store.updateMeta({ lastChangesAt: watermark });
    this.#emitStatus();
  }

  #applyChanges(records) {
    const pendingIds = this._outbox.targetIds();
    for (const record of records) {
      if (!record?.id || pendingIds.has(record.id)) {
        continue;
      }
      if (isDeletedRecord(record)) {
        this._store.removeRecord(record.id);
        continue;
      }
      this._store.putRecord(record, { synced: true });
    }
  }

  // ── Outbox outcomes ────────────────────────────────────────────────

  async #handleCreated(entry, record) {
    const localRecord = this._store.getRecord(entry.local_id);
    this._store.removeRecord(entry.local_id);
    this._store.replaceListId(entry.local_id, record.id);

    const stillPending = this._outbox.hasPending(record.id);
    const nextRecord = stillPending && localRecord ? { ...localRecord, id: record.id, revision: record.revision } : record;
    this._store.putRecord(nextRecord, { synced: !stillPending });
  }

  async #handleApplied(entry, record) {
    if (entry.op === "remove" || entry.op === "purge") {
      this._store.removeRecord(entry.target_id);
      return;
    }

    if (entry.op === "setKey") {
      if (this._outbox.hasPending(entry.target_id)) {
        return;
      }
      const cached = this._store.getRecordEntry(entry.target_id)?.record;
      this._store.putRecord({ ...cached, remote_id: record?.id || cached?.remote_id, data: record?.data ?? entry.payload.data }, { synced: true });
      return;
    }

    if (!record?.id) {
      return;
    }

    if (this._outbox.hasPending(record.id)) {
      const localRecord = this._store.getRecordEntry(record.id)?.record;
      this._store.putRecord({ ...(localRecord || record), revision: record.revision });
      return;
    }

    this._store.putRecord(record, { synced: true });
  }

  // The remote version wins the record; the local edits survive as a separate, synced copy.
  async #handleConflict(entry, current) {
    const localRecord = this._store.getRecordEntry(entry.target_id)?.record;
    this._outbox.removeWhere((candidate) => candidate.op === "update" && candidate.target_id === entry.target_id);

    if (current?.id) {
      this._store.putRecord(current, { synced: true });
    }

    const meta = this._store.getMeta();
    const conflictId = current?.id || entry.target_id;
    this._store.updateMeta({
      conflicts: meta.conflicts + 1,
      conflictIds: meta.conflictIds.includes(conflictId) ? meta.conflictIds : [...meta.conflictIds, conflictId],
    });

    if (entry.op !== "update" || !localRecord) {
      return;
    }

    this.create(localRecord.collection, {
      scope: localRecord.scope,
      title: `${localRecord.title || "Untitled"} (conflict copy)`,
      data: localRecord.data,
      tags: localRecord.tags,
      parentId: localRecord.parent_id,
      refId: localRecord.ref_id,
      aclSourceId: localRecord.acl_source_id,
      startsAt: localRecord.starts_at,
      endsAt: localRecord.ends_at,
      searchText: localRecord.search_text,
    });
  }

  async #handleRejected(entry, outcome) {
    if (entry.op === "create") {
      this._store.removeRecord(entry.local_id);
    }

    // The optimistic copy carries operations the server refused; the next read refetches it.
    if (entry.op === "patch" && !this._outbox.hasPending(this.#resolveId(entry.target_id))) {
      this._store.removeRecord(this.#resolveId(entry.target_id));
    }

    // 404 covers purged records and records the principal can no longer reach.
    if (outcome.status === 404) {
      this._store.removeRecord(this.#resolveId(entry.target_id));
    }

    const meta = this._store.getMeta();
    const failure = { op: entry.op, target_id: entry.target_id, status: outcome.status, message: outcome.message, at: this._now() };
    this._store.updateMeta({ failures: [...meta.failures, failure].slice(-FAILURE_HISTORY_LIMIT) });
  }

  // ── Helpers ────────────────────────────────────────────────────────

  #resolveId(id) {
    const { idMap } = this._store.getMeta();
    return idMap[id] || id;
  }

  #trackCollection(collection) {
    const meta = this._store.getMeta();
    if (!collection || meta.collections.includes(collection)) {
      return;
    }
    this._store.updateMeta({ collections: [...meta.collections, collection] });
  }

  #cacheRemote(record, pendingIds) {
    if (!record?.id || pendingIds.has(record.id) || isDeletedRecord(record)) {
      return;
    }
    this._store.putRecord(record, { synced: true });
  }

  #overlay(items, query, { includeLocalCreates }) {
    const entries = this._outbox.entries();
    const pendingIds = this._outbox.targetIds();
    const removedIds = new Set(entries.filter((entry) => entry.op === "remove" || entry.op === "purge").map((entry) => this.#resolveId(entry.target_id)));

    const overlaid = items
      .filter((item) => item && !removedIds.has(item.id))
      .map((item) => (pendingIds.has(item.id) ? this._store.getRecordEntry(item.id)?.record || item : item));

    if (!includeLocalCreates) {
      return overlaid;
    }

    const presentIds = new Set(overlaid.map((item) => item.id));
    const localCreates = this._store
      .listRecords()
      .filter(
        (record) =>
          isLocalId(record.id) &&
          !presentIds.has(record.id) &&
          matchesCollectionQuery(
            { ...record, parent_id: this.#resolveId(record.parent_id), ref_id: this.#resolveId(record.ref_id) },
            query,
          ),
      );

    return [...localCreates, ...overlaid];
  }

  async #readSelector(selector, query, { includeLocalCreates = false } = {}) {
    this.#trackCollection(query.collection);
    const hash = hashValue({ selector, query });

    if (this._isOnline()) {
      try {
        const result = await this._http.request({ path: `${DATA_PATH}/${selector}`, query });
        const items = extractItems(result);
        const pendingIds = this._outbox.targetIds();
        items.forEach((record) => this.#cacheRemote(record, pendingIds));
        this._store.putList(hash, {
          ids: items.map((record) => record.id),
          totalItems: result?.totalItems ?? items.length,
          collection: query.collection,
        });
        return {
          items: this.#overlay(items, query, { includeLocalCreates }),
          totalItems: result?.totalItems ?? items.length,
          fromCache: false,
        };
      } catch (error) {
        if (!isRetryableHttpError(error)) {
          throw error;
        }
      }
    }

    const cached = this._store.getList(hash);
    const items = (cached?.ids || []).map((id) => this._store.getRecordEntry(id)?.record).filter(Boolean);
    return {
      items: this.#overlay(items, query, { includeLocalCreates }),
      totalItems: cached?.totalItems ?? items.length,
      fromCache: true,
    };
  }

  // ── Reads ──────────────────────────────────────────────────────────

  list(collection, { scope, parentId, refId, tags, page, pageSize, sort, createdAfter, createdBefore, countOnly } = {}) {
    // A route opened while a record was local keeps its local id; once synced the server knows only the mapped id.
    const query = {
      collection,
      scope,
      parent_id: parentId ? this.#resolveId(parentId) : parentId,
      ref_id: refId ? this.#resolveId(refId) : refId,
      tags,
      created_after: createdAfter,
      created_before: createdBefore,
    };

    if (countOnly) {
      return this.#readCount(query);
    }

    return this.#readSelector("collection", { ...query, page, pageSize, sort }, { includeLocalCreates: true });
  }

  // `count_only` answers `{ totalItems }`; offline, the last count read for the same query is reused.
  async #readCount(query) {
    this.#trackCollection(query.collection);
    const countQuery = { ...query, count_only: true };
    const hash = hashValue({ selector: "collection", query: countQuery });

    if (this._isOnline()) {
      try {
        const result = await this._http.request({ path: `${DATA_PATH}/collection`, query: countQuery });
        const totalItems = result?.totalItems ?? 0;
        this._store.putList(hash, { ids: [], totalItems, collection: query.collection });
        return { totalItems, fromCache: false };
      } catch (error) {
        if (!isRetryableHttpError(error)) {
          throw error;
        }
      }
    }

    return { totalItems: this._store.getList(hash)?.totalItems ?? null, fromCache: true };
  }

  async get(id) {
    const resolvedId = this.#resolveId(id);
    const cached = this._store.getRecordEntry(resolvedId)?.record;

    if (isLocalId(resolvedId) || this._outbox.hasPending(resolvedId)) {
      return cached || null;
    }

    if (this._isOnline()) {
      try {
        const record = await this._http.request({ path: `${DATA_PATH}/id`, query: { id: resolvedId } });
        if (!record?.id) {
          return null;
        }
        if (isDeletedRecord(record)) {
          this._store.removeRecord(resolvedId);
          return record;
        }
        this._store.putRecord(record, { synced: true });
        return record;
      } catch (error) {
        if (error.status === 404) {
          this._store.removeRecord(resolvedId);
          return null;
        }
        if (!isRetryableHttpError(error)) {
          throw error;
        }
      }
    }

    return this._store.getRecord(resolvedId);
  }

  async range(collection, { startsAt, endsAt } = {}) {
    const { items, fromCache } = await this.#readSelector("range", { collection, starts_at: startsAt, ends_at: endsAt });
    return { items, fromCache };
  }

  async search(collection, text) {
    const { items, fromCache } = await this.#readSelector("search", { collection, search: text });
    return { items, fromCache };
  }

  sharedWithMe({ collection } = {}) {
    return this.#readSelector("shared-with-me", { collection });
  }

  recent({ collection, limit } = {}) {
    return this.#readSelector("recent", { collection, limit });
  }

  trash({ collection } = {}) {
    return this.#readSelector("trash", { collection });
  }

  // `owner` reads the keyed record of another identity that shared it through its ACL (null otherwise).
  async getKey(collection, key, { scope = DEFAULT_SCOPE, owner } = {}) {
    const recordId = keyRecordId(collection, scope, key, owner);
    const cached = this._store.getRecordEntry(recordId)?.record;

    if (this._outbox.hasPending(recordId) || !this._isOnline()) {
      return cached?.data ?? null;
    }

    try {
      const result = await this._http.request({
        path: `${DATA_PATH}/key`,
        query: { collection, key, scope, owner_veripass_identity: owner },
      });
      const record = result?.record || null;
      const data = record?.data ?? null;
      this._store.putRecord({ id: recordId, remote_id: record?.id || null, collection, key, scope, data }, { synced: true });
      return data;
    } catch (error) {
      if (!isRetryableHttpError(error)) {
        throw error;
      }
      return cached?.data ?? null;
    }
  }

  // ── Mutations (local first, replayed through the outbox) ───────────

  create(collection, input = {}) {
    if (!collection) {
      throw new Error("collection is required");
    }

    const localId = `${LOCAL_ID_PREFIX}${createUuid()}`;
    const timestamp = this._now();
    const payload = { collection, scope: DEFAULT_SCOPE, ...toRecordFields(input) };
    // Ownership is assigned by the backend from the principal; the local copy mirrors it so readers
    // see the same record shape before the first sync.
    const record = {
      ...payload,
      id: localId,
      owner_veripass_identity: this._veripassIdentity,
      organization_id: payload.scope === PERSONAL_SCOPE ? null : this._organizationId,
      revision: 0,
      created: { timestamp },
      modified: { timestamp },
    };

    this.#trackCollection(collection);
    this._store.putRecord(record);
    this._outbox.enqueue({ op: "create", payload, targetId: localId, localId });
    this.#afterMutation();
    return Promise.resolve(record);
  }

  update(id, patch = {}, { expectedRevision } = {}) {
    if (!id) {
      throw new Error("id is required");
    }

    const resolvedId = this.#resolveId(id);
    const current = this._store.getRecordEntry(resolvedId)?.record;
    const fields = toRecordFields(patch);
    const timestamp = this._now();
    const record = { ...(current || {}), ...fields, id: resolvedId, modified: { timestamp } };

    this._store.putRecord(record);
    this._outbox.enqueue({
      op: "update",
      payload: { id: resolvedId, ...fields },
      targetId: resolvedId,
      expectedRevision: expectedRevision ?? current?.revision ?? null,
    });
    this.#afterMutation();
    return Promise.resolve(record);
  }

  // Atomic field-level operations without a revision check: concurrent editors never conflict. The
  // local record takes the operations immediately; the outbox replays them once (client_mutation_id).
  patch(id, operations) {
    if (!id) {
      return Promise.reject(new Error("id is required"));
    }

    try {
      validatePatchOperations(operations);
    } catch (error) {
      return Promise.reject(error);
    }

    const resolvedId = this.#resolveId(id);
    const current = this._store.getRecordEntry(resolvedId)?.record;
    // Without a cached copy there is nothing to patch locally: the next read returns the server result.
    const record = current ? { ...applyPatchOperations(current, operations), modified: { timestamp: this._now() } } : null;

    if (record) {
      this._store.putRecord(record);
    }
    this._outbox.enqueue({ op: "patch", payload: { id: resolvedId, operations }, targetId: resolvedId });
    this.#afterMutation();
    return Promise.resolve(record);
  }

  remove(id) {
    const resolvedId = this.#resolveId(id);
    this._store.removeRecord(resolvedId);

    const hasQueuedCreate = this._outbox.entries().some((entry) => entry.op === "create" && entry.local_id === resolvedId);
    if (isLocalId(resolvedId) && hasQueuedCreate) {
      const dropped = this._outbox.removeWhere((entry) => entry.target_id === resolvedId);
      if (dropped.some((entry) => entry.op === "create")) {
        this.#emitStatus();
        return Promise.resolve();
      }
    }

    this._outbox.enqueue({ op: "remove", payload: { id: resolvedId }, targetId: resolvedId });
    this.#afterMutation();
    return Promise.resolve();
  }

  restore(id) {
    const resolvedId = this.#resolveId(id);
    this._outbox.enqueue({ op: "restore", payload: { id: resolvedId }, targetId: resolvedId });
    this.#afterMutation();
    return Promise.resolve();
  }

  purge(id) {
    const resolvedId = this.#resolveId(id);
    this._store.removeRecord(resolvedId);
    this._outbox.enqueue({ op: "purge", payload: { id: resolvedId }, targetId: resolvedId });
    this.#afterMutation();
    return Promise.resolve();
  }

  share(id, acl) {
    const resolvedId = this.#resolveId(id);
    const current = this._store.getRecordEntry(resolvedId)?.record;
    if (current) {
      this._store.putRecord({ ...current, acl });
    }
    this._outbox.enqueue({ op: "share", payload: { id: resolvedId, acl }, targetId: resolvedId });
    this.#afterMutation();
    return Promise.resolve();
  }

  // `acl` shares the caller's keyed record (the caller stays its owner); omitted, the stored ACL is kept.
  setKey(collection, key, data, { scope = DEFAULT_SCOPE, acl } = {}) {
    const recordId = keyRecordId(collection, scope, key);
    const cached = this._store.getRecordEntry(recordId)?.record;
    const aclFields = acl ? { acl } : {};

    this._store.putRecord({
      id: recordId,
      remote_id: cached?.remote_id || null,
      collection,
      key,
      scope,
      data,
      ...(acl ? aclFields : cached?.acl ? { acl: cached.acl } : {}),
    });
    this._outbox.enqueue({ op: "setKey", payload: { collection, key, scope, data, ...aclFields }, targetId: recordId });
    this.#afterMutation();
    return Promise.resolve();
  }

  // ── Realtime ───────────────────────────────────────────────────────

  // `{ collection }` observes every record of the collection in the organization; `{ collection, refId }`
  // or `{ collection, id }` observes one reference. Signals carry no data: callbacks refetch.
  subscribe({ collection, refId, id } = {}, callback) {
    if (!this._realtime || !collection || typeof callback !== "function") {
      return () => {};
    }

    const reference = refId || id ? this.#resolveId(refId || id) : null;
    const recordId = id ? this.#resolveId(id) : id;
    // Collection channels are organization-wide; personal sessions only observe named references.
    if (!reference && !this._organizationId) {
      return () => {};
    }
    const channel = reference ? `app-data:${this._appSlug}:${collection}:${reference}` : `app-data:${this._appSlug}:${collection}`;
    const seenSignals = new Set();

    return this._realtime.listen(channel, RECORD_SIGNALS, (payload, name) => {
      if (payload?.collection && payload.collection !== collection) {
        return;
      }
      if (recordId && !refId && payload?.id !== recordId) {
        return;
      }

      // The hub dispatches by signal name, so a record signal also delivered on another subscribed
      // channel reaches this callback twice; one write has one (name, id, revision).
      const signalKey = `${name}:${payload?.id}:${payload?.revision}`;
      if (seenSignals.has(signalKey)) {
        return;
      }
      seenSignals.add(signalKey);
      if (seenSignals.size > SIGNAL_DEDUPE_LIMIT) {
        seenSignals.delete(seenSignals.values().next().value);
      }

      const cached = payload?.id ? this._store.getRecordEntry(payload.id)?.record : null;
      const isStale = cached && (name === "record.deleted" || (payload.revision ?? 0) > (cached.revision ?? 0));
      if (isStale && !this._outbox.hasPending(payload.id)) {
        this._store.removeRecord(payload.id);
      }

      callback({ name, ...payload, ref_id: payload?.ref_id ?? null });
    });
  }

  toSdk() {
    return {
      list: (collection, options) => this.list(collection, options),
      get: (id) => this.get(id),
      range: (collection, options) => this.range(collection, options),
      search: (collection, text) => this.search(collection, text),
      sharedWithMe: (options) => this.sharedWithMe(options),
      recent: (options) => this.recent(options),
      trash: (options) => this.trash(options),
      create: (collection, input) => this.create(collection, input),
      update: (id, patch, options) => this.update(id, patch, options),
      patch: (id, operations) => this.patch(id, operations),
      remove: (id) => this.remove(id),
      restore: (id) => this.restore(id),
      purge: (id) => this.purge(id),
      share: (id, acl) => this.share(id, acl),
      getKey: (collection, key, options) => this.getKey(collection, key, options),
      setKey: (collection, key, data, options) => this.setKey(collection, key, data, options),
      subscribe: (target, callback) => this.subscribe(target, callback),
      status: () => this.status(),
      acknowledgeConflicts: () => this.acknowledgeConflicts(),
      onStatusChange: (callback) => this.onStatusChange(callback),
      flush: (options) => this.flush(options),
    };
  }
}

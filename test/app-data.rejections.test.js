import { describe, it } from "node:test";
import assert from "node:assert/strict";

import AppDataClient from "../src/features/app-engine/runtime/data/data-client.js";
import { applyPatchOperations, validatePatchOperations } from "../src/features/app-engine/runtime/data/data-patch.js";
import { matchesWhere } from "../src/features/app-engine/runtime/data/data-query.js";
import { RuntimeHttpError } from "../src/features/app-engine/runtime/shared/runtime-http.client.js";

const APP_SLUG = "stoneos-invoices";
const BATCH_PATH = "/app-engine/data/batch";

const DUPLICATE = { error_code: "APP_DATA_DUPLICATE", collection: "invoices", fields: ["number"] };
const DUPLICATE_MESSAGE = "Another record of invoices already has the same number";

const stored = (id, data = {}, extra = {}) => ({
  id,
  collection: "invoices",
  scope: "user-appdata",
  revision: 3,
  data,
  ...extra,
});

// `sdk.data` over a fake server: reads answer `items`, and `POST /data/batch` answers what `decide` says for each
// operation, in the envelope the backend uses (one result per operation, in order).
const createClient = ({ items = [], decide = () => ({ status: 200, success: true, result: {} }), online = true } = {}) => {
  const batches = [];
  const state = { online, items };
  const http = {
    request: async (request) => {
      if (request.path !== BATCH_PATH) {
        return { items: state.items, totalItems: state.items.length };
      }
      batches.push(request.body.operations);
      return {
        results: request.body.operations.map((operation, index) => ({
          index,
          op: operation.op,
          client_mutation_id: operation.payload.client_mutation_id,
          ...decide(operation, index),
        })),
      };
    },
  };
  const client = new AppDataClient({
    http,
    appSlug: APP_SLUG,
    veripassIdentity: "vp-1",
    organizationId: "org-1",
    isOnline: () => state.online,
  });

  return { client, batches, state };
};

const refused = (status, result, message = DUPLICATE_MESSAGE) => ({ status, success: false, message, result });
const withoutTime = ({ at, ...failure }) => failure;

describe("sdk.data refusals of the queued writes", () => {
  it("drops a create that a unique index refused, and tells the app why", async () => {
    const { client, state } = createClient({ decide: () => refused(409, DUPLICATE) });

    const created = await client.create("invoices", { title: "INV-2", data: { number: "INV-2" } });
    assert.equal(client.status().pending, 1);

    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0, "the refused write left the outbox");
    assert.equal(status.conflicts, 0, "a duplicate is not a revision conflict");
    assert.deepEqual(status.conflictIds, []);
    assert.deepEqual(status.failures.map(withoutTime), [
      {
        op: "create",
        target_id: created.id,
        status: 409,
        message: DUPLICATE_MESSAGE,
        error_code: "APP_DATA_DUPLICATE",
        collection: "invoices",
        fields: ["number"],
      },
    ]);

    state.online = false;
    const { items } = await client.list("invoices");
    assert.deepEqual(items, [], "the optimistic record is gone, as if it was never saved");
  });

  it("drops an update that a unique index refused, without a conflict copy, and reverts the optimistic value", async () => {
    const server = stored("appdat-1", { number: "INV-1" });
    const { client, state } = createClient({ items: [server], decide: () => refused(409, DUPLICATE) });

    await client.list("invoices");
    await client.update("appdat-1", { data: { number: "INV-2" } });
    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0, "no conflict copy was queued");
    assert.equal(status.conflicts, 0);
    assert.deepEqual(status.failures.map(withoutTime), [
      {
        op: "update",
        target_id: "appdat-1",
        status: 409,
        message: DUPLICATE_MESSAGE,
        error_code: "APP_DATA_DUPLICATE",
        collection: "invoices",
        fields: ["number"],
      },
    ]);

    state.online = false;
    const { items } = await client.list("invoices");
    assert.equal(
      items.some((item) => item.data?.number === "INV-2" || /conflict copy/.test(item.title || "")),
      false,
      "the refused value is not shown",
    );
  });

  it("drops a key write and a patch that a unique index refused", async () => {
    const server = stored("appdat-1", { count: 1 });
    const { client, state } = createClient({ items: [server], decide: () => refused(409, DUPLICATE) });

    await client.list("invoices");
    await client.setKey("settings", "numbering", { next: 1 }, { scope: "app" });
    await client.patch("appdat-1", [{ op: "increment", path: "data.count", value: 1 }]);
    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0);
    assert.equal(status.conflicts, 0);
    assert.deepEqual(
      status.failures.map(({ op, error_code: code }) => [op, code]),
      [
        ["setKey", "APP_DATA_DUPLICATE"],
        ["patch", "APP_DATA_DUPLICATE"],
      ],
    );

    state.online = false;
    assert.equal(await client.getKey("settings", "numbering", { scope: "app" }), null, "the refused key value is gone");
  });

  it("records a restore that a unique index refused as a refusal, not as a revision conflict", async () => {
    const trashed = stored("appdat-1", { number: "INV-1" }, { status: { id: -1, name: "deleted" } });
    const { client } = createClient({ items: [trashed], decide: () => refused(409, DUPLICATE, DUPLICATE_MESSAGE) });

    await client.restore("appdat-1");
    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0);
    assert.equal(status.conflicts, 0, "the refused restore is not a revision conflict");
    assert.deepEqual(status.conflictIds, []);
    assert.deepEqual(status.failures.map(withoutTime), [
      {
        op: "restore",
        target_id: "appdat-1",
        status: 409,
        message: DUPLICATE_MESSAGE,
        error_code: "APP_DATA_DUPLICATE",
        collection: "invoices",
        fields: ["number"],
      },
    ]);
  });

  it("still treats a revision conflict as a conflict: the stored record wins and the edit survives as a copy", async () => {
    const current = stored("appdat-1", { number: "INV-1" }, { revision: 5, title: "Server" });
    const { client, batches } = createClient({
      items: [stored("appdat-1", { number: "INV-1" }, { title: "Old" })],
      decide: (operation) => (operation.op === "update" ? refused(409, { current }, "Revision conflict") : { status: 200, success: true, result: stored("appdat-2", {}) }),
    });

    await client.list("invoices");
    await client.update("appdat-1", { title: "Mine", data: { number: "INV-1" } });
    await client.flush();

    const status = client.status();
    assert.equal(status.conflicts, 1);
    assert.deepEqual(status.conflictIds, ["appdat-1"]);
    assert.deepEqual(status.failures, []);
    assert.deepEqual(
      batches.flat().map((operation) => [operation.op, operation.payload.title]),
      [
        ["update", "Mine"],
        ["create", "Mine (conflict copy)"],
      ],
      "the edit was sent again as a conflict copy",
    );
  });

  it("treats a 409 without a reason as a revision conflict, as before", async () => {
    const { client } = createClient({
      items: [stored("appdat-1", { number: "INV-1" })],
      decide: (operation) => (operation.op === "update" ? refused(409, null, "Conflict") : { status: 200, success: true, result: stored("appdat-2", {}) }),
    });

    await client.list("invoices");
    await client.update("appdat-1", { title: "Mine" });
    await client.flush();

    assert.equal(client.status().conflicts, 1);
    assert.deepEqual(client.status().failures, []);
  });

  it("answers the same when the whole request fails with the duplicate refusal", async () => {
    const http = {
      request: async (request) => {
        if (request.path !== BATCH_PATH) {
          return { items: [] };
        }
        throw new RuntimeHttpError({ status: 409, message: DUPLICATE_MESSAGE, body: { result: DUPLICATE } });
      },
    };
    const client = new AppDataClient({ http, appSlug: APP_SLUG, veripassIdentity: "vp-1", organizationId: "org-1", isOnline: () => true });

    await client.create("invoices", { title: "INV-2", data: { number: "INV-2" } });
    await client.flush();

    assert.equal(client.status().pending, 0);
    assert.equal(client.status().conflicts, 0);
    assert.equal(client.status().failures[0].error_code, "APP_DATA_DUPLICATE");
    assert.deepEqual(client.status().failures[0].fields, ["number"]);
  });

  it("records the reason of any other refusal that carries one", async () => {
    const { client } = createClient({
      decide: () => refused(400, { error_code: "APP_DATA_FIELD_NOT_DECLARED" }, "The field is not declared"),
    });

    await client.create("invoices", { title: "INV", data: {} });
    await client.flush();

    assert.equal(client.status().failures[0].error_code, "APP_DATA_FIELD_NOT_DECLARED");
    assert.equal(client.status().failures[0].status, 400);
    assert.equal(client.status().failures[0].collection, "invoices", "a create names its collection");
    assert.equal("fields" in client.status().failures[0], false);
  });

  it("drops what was queued behind a refused create, so the queue is not blocked for good", async () => {
    const { client, batches } = createClient({
      decide: (operation) =>
        operation.payload.title === "INV-2" ? refused(409, DUPLICATE) : { status: 200, success: true, result: stored("appdat-9", {}) },
    });

    const invoice = await client.create("invoices", { title: "INV-2", data: { number: "INV-2" } });
    const line = await client.create("lines", { title: "line", parentId: invoice.id, data: { amount: 5 } });
    await client.update(invoice.id, { title: "INV-2 edited" });
    await client.create("invoices", { title: "Other", data: { number: "INV-3" } });
    assert.equal(client.status().pending, 4);

    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0, "nothing waits for an id that never comes");
    assert.deepEqual(
      status.failures.map(({ op, target_id: target, error_code: code, depends_on: dependsOn }) => ({ op, target, code, dependsOn })),
      [
        { op: "create", target: invoice.id, code: "APP_DATA_DUPLICATE", dependsOn: undefined },
        { op: "create", target: line.id, code: "APP_DATA_DEPENDENCY_REFUSED", dependsOn: invoice.id },
        { op: "update", target: invoice.id, code: "APP_DATA_DEPENDENCY_REFUSED", dependsOn: invoice.id },
      ],
    );
    assert.deepEqual(
      batches.flat().map((operation) => operation.payload.title),
      ["INV-2", "Other"],
      "the line and the edit were never sent; the independent create was",
    );
  });

  it("keeps the refusals until the app acknowledges them, and notifies the change", async () => {
    const { client } = createClient({ decide: () => refused(409, DUPLICATE) });
    const sdk = client.toSdk();
    const snapshots = [];
    const unsubscribe = sdk.onStatusChange((snapshot) => snapshots.push(snapshot.failures.length));

    await sdk.create("invoices", { title: "INV-2", data: { number: "INV-2" } });
    await sdk.flush();
    assert.equal(sdk.status().failures.length, 1);
    assert.equal(snapshots.at(-1), 1, "the status change carries the failure");

    sdk.acknowledgeFailures();
    assert.deepEqual(sdk.status().failures, []);
    assert.equal(snapshots.at(-1), 0);

    unsubscribe();
  });

  it("keeps only the latest failures", async () => {
    const { client } = createClient({ decide: () => refused(409, DUPLICATE) });

    for (let attempt = 0; attempt < 25; attempt += 1) {
      await client.create("invoices", { title: `INV-${attempt}`, data: { number: `INV-${attempt}` } });
      await client.flush();
    }

    assert.equal(client.status().failures.length, 20);
  });
});

describe("sdk.data paths that reach the prototype chain", () => {
  const unsafePaths = ["data.__proto__.polluted", "data.constructor.prototype.polluted", "data.nested.prototype.polluted", "data.__proto__"];

  it("refuses them before touching the outbox", async () => {
    const { client } = createClient();

    for (const path of unsafePaths) {
      await assert.rejects(client.patch("appdat-1", [{ op: "set", path, value: "yes" }]), /not allowed/, path);
    }
    await assert.rejects(client.patch("appdat-1", [{ op: "merge", path: "data.meta", value: JSON.parse('{"__proto__":{"polluted":"yes"}}') }]), /plain keys/);
    assert.equal(client.status().pending, 0);
    assert.equal(({}).polluted, undefined);
  });

  it("validates and applies without reaching Object.prototype", () => {
    for (const path of unsafePaths) {
      assert.throws(() => validatePatchOperations([{ op: "set", path, value: "yes" }]), /not allowed/);
    }

    const patched = applyPatchOperations({ data: { status: "a" } }, [
      { op: "set", path: "data.status", value: "x" },
      { op: "set", path: "data.__proto__.polluted", value: "yes" },
      { op: "merge", path: "data.meta", value: JSON.parse('{"ok":1,"__proto__":{"polluted":"yes"}}') },
    ]);

    assert.equal(({}).polluted, undefined);
    assert.deepEqual(patched.data, { status: "x", meta: { ok: 1 } });
  });

  it("reads values and operators of a query from own properties only", () => {
    assert.equal(matchesWhere({ data: {} }, { "constructor.name": "Object" }), false);
    assert.equal(matchesWhere({ data: { status: "open" } }, { status: { constructor: "open" } }), false);
    assert.equal(matchesWhere({ data: { status: "open" } }, { status: { $gte: "a" } }), true);
  });
});

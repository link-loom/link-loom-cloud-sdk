import { describe, it } from "node:test";
import assert from "node:assert/strict";

import AppDataClient from "../src/features/app-engine/runtime/data/data-client.js";
import { matchesWhere, serializeWhere } from "../src/features/app-engine/runtime/data/data-query.js";
import { RuntimeHttpError } from "../src/features/app-engine/runtime/shared/runtime-http.client.js";

const APP_SLUG = "stoneos-invoices";

// `sdk.data` over a fake HTTP client that records every request and answers what the test says.
const createClient = ({ respond = () => ({ items: [], totalItems: 0 }), online = true } = {}) => {
  const requests = [];
  const state = { online };
  const http = {
    request: async (request) => {
      requests.push(request);
      return respond(request);
    },
  };
  const client = new AppDataClient({
    http,
    appSlug: APP_SLUG,
    veripassIdentity: "vp-1",
    organizationId: "org-1",
    isOnline: () => state.online,
  });

  return { client, requests, state };
};

const record = (id, data = {}, extra = {}) => ({
  id,
  collection: "invoices",
  scope: "user-appdata",
  revision: 1,
  data,
  ...extra,
});

describe("serializeWhere", () => {
  it("sends the filter as JSON with its keys in a stable order", () => {
    assert.equal(serializeWhere({ b: 1, a: { $lt: 5, $gt: 1 } }), '{"a":{"$gt":1,"$lt":5},"b":1}');
    assert.equal(serializeWhere({ a: 1, b: 2 }), serializeWhere({ b: 2, a: 1 }));
  });

  it("has nothing to send without conditions", () => {
    for (const where of [undefined, null, "", {}]) {
      assert.equal(serializeWhere(where), undefined);
    }
  });

  it("refuses anything that is not an object", () => {
    for (const where of [[], 3, true]) {
      assert.throws(() => serializeWhere(where), /where must be an object/);
    }
  });
});

describe("matchesWhere", () => {
  const invoice = { data: { status: "open", total: 30, due_at: 200, customer: { id: "c1" }, items: [{ sku: "k1" }, { sku: "k2" }, 7] } };

  it("matches without a where, and reads the JSON string the client sends", () => {
    assert.equal(matchesWhere(invoice, undefined), true);
    assert.equal(matchesWhere(invoice, '{"status":"open"}'), true);
    assert.equal(matchesWhere(invoice, '{"status":"paid"}'), false);
    assert.equal(matchesWhere(invoice, "not json"), true);
  });

  it("compares plain values and the operators, on every condition together", () => {
    assert.equal(matchesWhere(invoice, { status: "open", total: { $gte: 30, $lt: 31 } }), true);
    assert.equal(matchesWhere(invoice, { status: "open", total: { $gt: 30 } }), false);
    assert.equal(matchesWhere(invoice, { status: { $ne: "paid" } }), true);
    assert.equal(matchesWhere(invoice, { status: { $in: ["paid", "open"] } }), true);
    assert.equal(matchesWhere(invoice, { status: { $nin: ["open"] } }), false);
  });

  it("follows dotted paths through objects and arrays", () => {
    assert.equal(matchesWhere(invoice, { "customer.id": "c1" }), true);
    assert.equal(matchesWhere(invoice, { "items.sku": "k2" }), true);
    assert.equal(matchesWhere(invoice, { "items.sku": "k9" }), false);
    assert.equal(matchesWhere(invoice, { "items.sku": { $in: ["k9", "k1"] } }), true);
  });

  it("treats a missing field as null and answers $exists", () => {
    assert.equal(matchesWhere(invoice, { paid_at: null }), true);
    assert.equal(matchesWhere(invoice, { status: null }), false);
    assert.equal(matchesWhere(invoice, { paid_at: { $exists: false } }), true);
    assert.equal(matchesWhere(invoice, { status: { $exists: true } }), true);
    assert.equal(matchesWhere(invoice, { paid_at: { $ne: "x" } }), true);
  });

  it("reads null as a held value and an absent field as no value, as the database does", () => {
    const nulled = { data: { number: null, customer: { id: null }, owner: null } };
    const absent = { data: { status: "draft" } };

    // Equality with null finds both, so a unique-null record and an absent one answer the same list.
    assert.equal(matchesWhere(nulled, { number: null }), true);
    assert.equal(matchesWhere(absent, { number: null }), true);
    assert.equal(matchesWhere(nulled, { number: { $eq: null } }), true);
    assert.equal(matchesWhere(absent, { number: { $eq: null } }), true);

    // $exists tells them apart: null is held, absent is not.
    assert.equal(matchesWhere(nulled, { number: { $exists: true } }), true);
    assert.equal(matchesWhere(nulled, { number: { $exists: false } }), false);
    assert.equal(matchesWhere(absent, { number: { $exists: true } }), false);
    assert.equal(matchesWhere(absent, { number: { $exists: false } }), true);
    assert.equal(matchesWhere(nulled, { "customer.id": { $exists: true } }), true);
    assert.equal(matchesWhere(nulled, { "owner.id": { $exists: true } }), false, "a null parent holds no child");

    // $ne: null leaves out both.
    assert.equal(matchesWhere(nulled, { number: { $ne: null } }), false);
    assert.equal(matchesWhere(absent, { number: { $ne: null } }), false);
    assert.equal(matchesWhere({ data: { number: "N-1" } }, { number: { $ne: null } }), true);
  });

  it("does not compare values of different types", () => {
    assert.equal(matchesWhere(invoice, { total: { $gt: "1" } }), false);
    assert.equal(matchesWhere(invoice, { status: { $lt: 5 } }), false);
  });
});

describe("sdk.data list, range and search with declared fields", () => {
  it("sends where as a JSON string and keeps the other options", async () => {
    const { client, requests } = createClient();

    await client.list("invoices", {
      scope: "app",
      where: { status: "open", due_at: { $lt: 500 } },
      sort: "-data.due_at,modified",
      page: 2,
      pageSize: 10,
    });

    assert.equal(requests[0].path, "/app-engine/data/collection");
    assert.equal(requests[0].query.where, '{"due_at":{"$lt":500},"status":"open"}');
    assert.equal(requests[0].query.sort, "-data.due_at,modified");
    assert.equal(requests[0].query.collection, "invoices");
    assert.equal(requests[0].query.page, 2);
  });

  it("counts by the filter", async () => {
    const { client, requests } = createClient({ respond: () => ({ totalItems: 4 }) });

    const counted = await client.list("invoices", { where: { status: "open" }, countOnly: true });

    assert.equal(counted.totalItems, 4);
    assert.equal(requests[0].query.count_only, true);
    assert.equal(requests[0].query.where, '{"status":"open"}');
  });

  it("does not send a where for a list without conditions", async () => {
    const { client, requests } = createClient();

    await client.list("invoices", { where: {} });

    assert.equal(requests[0].query.where, undefined);
  });

  it("shows records created offline only when they satisfy the filter", async () => {
    const { client } = createClient({ online: false });

    await client.create("invoices", { scope: "app", title: "open one", data: { status: "open", number: "A" } });
    await client.create("invoices", { scope: "app", title: "paid one", data: { status: "paid", number: "B" } });

    const everything = await client.list("invoices", { scope: "app" });
    const open = await client.list("invoices", { scope: "app", where: { status: "open" } });

    assert.equal(everything.items.length, 2);
    assert.deepEqual(
      open.items.map((item) => item.title),
      ["open one"],
    );
  });

  it("filters a range, and keeps the original arguments of search", async () => {
    const { client, requests } = createClient();

    await client.range("events", { startsAt: 1, endsAt: 2, where: { room: "a" } });
    await client.search("invoices", "energy");
    await client.search("invoices", "energy", { where: { status: "open" }, sort: "title", pageSize: 5 });

    assert.equal(requests[0].path, "/app-engine/data/range");
    assert.equal(requests[0].query.where, '{"room":"a"}');
    assert.equal(requests[1].path, "/app-engine/data/search");
    assert.equal(requests[1].query.search, "energy");
    assert.equal(requests[1].query.where, undefined);
    assert.equal(requests[2].query.where, '{"status":"open"}');
    assert.equal(requests[2].query.sort, "title");
    assert.equal(requests[2].query.pageSize, 5);
  });

  it("exposes the new options through sdk.data", async () => {
    const { client, requests } = createClient();
    const sdk = client.toSdk();

    await sdk.search("invoices", "energy", { where: { status: "open" } });

    assert.equal(typeof sdk.batch, "function");
    assert.equal(requests[0].query.where, '{"status":"open"}');
  });
});

describe("sdk.data batch", () => {
  const applied = (results) => ({ atomic: true, results });
  const success = (index, op, result) => ({ index, op, status: 200, success: true, result });

  it("sends one atomic request with the operations in the wire format", async () => {
    const { client, requests } = createClient({
      respond: () =>
        applied([
          success(0, "create", record("appdat-1", { number: "INV-1" })),
          success(1, "create", record("appdat-2", {}, { parent_id: "appdat-1" })),
        ]),
    });

    const outcome = await client.batch([
      { op: "create", collection: "invoices", input: { scope: "app", title: "INV-1", data: { number: "INV-1" } } },
      { op: "create", collection: "lines", input: { scope: "app", title: "line", parentId: "$0", data: { amount: 5 } } },
      { op: "patch", id: "$0", operations: [{ op: "increment", path: "data.total", value: 5 }] },
      { op: "update", id: "appdat-9", patch: { title: "Renamed" }, expectedRevision: 3 },
      { op: "setKey", collection: "settings", key: "numbering", data: { next: 2 }, scope: "app" },
      { op: "remove", id: "appdat-7" },
      { op: "restore", id: "appdat-8" },
      { op: "purge", id: "appdat-6" },
      { op: "share", id: "appdat-5", acl: { visibility: "organization", grants: [] } },
    ]);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].path, "/app-engine/data/batch");
    assert.equal(requests[0].body.atomic, true);

    const operations = requests[0].body.operations;

    assert.deepEqual(
      operations.map((operation) => operation.op),
      ["create", "create", "patch", "update", "set-key", "delete", "restore", "purge", "share"],
    );
    assert.deepEqual(operations[1].payload, {
      collection: "lines",
      scope: "app",
      title: "line",
      parent_id: "$0",
      data: { amount: 5 },
      client_mutation_id: operations[1].payload.client_mutation_id,
    });
    assert.equal(operations[2].payload.id, "$0");
    assert.equal(operations[3].payload.expected_revision, 3);
    assert.equal(operations[4].payload.scope, "app");
    assert.equal(new Set(operations.map((operation) => operation.payload.client_mutation_id)).size, 9);
    assert.equal(outcome.atomic, true);
    assert.equal(outcome.results.length, 2);
  });

  it("takes the mutation ids the caller chooses, so a retry applies nothing twice", async () => {
    const { client, requests } = createClient({ respond: () => applied([]) });

    await client.batch([{ op: "create", collection: "invoices", input: { title: "A" }, clientMutationId: "retry-1" }]);

    assert.equal(requests[0].body.operations[0].payload.client_mutation_id, "retry-1");
  });

  it("caches the committed records and forgets the removed ones", async () => {
    const { client, state } = createClient({
      respond: () =>
        applied([
          success(0, "create", record("appdat-1", { number: "INV-1" })),
          success(1, "delete", record("appdat-2", {}, { status: { name: "deleted" } })),
          success(2, "set-key", record("appdat-3", { next: 2 }, { collection: "settings", scope: "app", key: "numbering" })),
        ]),
    });

    await client.batch([
      { op: "create", collection: "invoices", input: { title: "INV-1" } },
      { op: "remove", id: "appdat-2" },
      { op: "setKey", collection: "settings", key: "numbering", data: { next: 2 }, scope: "app" },
    ]);
    state.online = false;

    assert.equal((await client.get("appdat-1")).data.number, "INV-1");
    assert.equal(await client.get("appdat-2"), null);
    assert.deepEqual(await client.getKey("settings", "numbering", { scope: "app" }), { next: 2 });
  });

  it("rejects with the failure of the transaction and caches nothing", async () => {
    const failure = new RuntimeHttpError({
      status: 409,
      message: "Operation 1 (create) failed. Nothing was written",
      body: { success: false, result: { error_code: "APP_DATA_BATCH_ABORTED", failed_index: 1, results: [] } },
    });
    const { client, state } = createClient({
      respond: () => {
        throw failure;
      },
    });

    await assert.rejects(
      client.batch([{ op: "create", collection: "invoices", input: { title: "A" } }]),
      (error) => error.status === 409 && error.body.result.failed_index === 1,
    );

    state.online = false;
    assert.equal(await client.get("appdat-1"), null);
  });

  it("needs a connection and sends nothing without one", async () => {
    const { client, requests } = createClient({ online: false });

    await assert.rejects(
      client.batch([{ op: "create", collection: "invoices", input: { title: "A" } }]),
      (error) => error instanceof RuntimeHttpError && error.network === true,
    );
    assert.equal(requests.length, 0);
  });

  it("refuses a record that only exists on this device, and invalid batches, before any request", async () => {
    const { client, requests, state } = createClient({ online: false });
    const created = await client.create("invoices", { title: "offline" });

    state.online = true;

    await assert.rejects(client.batch([{ op: "update", id: created.id, patch: { title: "x" } }]), /has not synced yet/);
    await assert.rejects(client.batch([]), /operations are required/);
    await assert.rejects(
      client.batch(Array.from({ length: 51 }, () => ({ op: "remove", id: "appdat-1" }))),
      /at most 50 operations/,
    );
    await assert.rejects(client.batch([{ op: "explode" }]), /unknown operation explode/);
    await assert.rejects(client.batch([{ op: "create", input: {} }]), /collection is required/);
    await assert.rejects(client.batch([{ op: "patch", id: "appdat-1", operations: [] }]), /operations are required/);
    assert.equal(requests.length, 0);
  });
});

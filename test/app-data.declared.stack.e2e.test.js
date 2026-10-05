// The browser client (`sdk.data`) against an app WITHOUT backend that declares `manifest.data` with a unique index on
// `invoices.number` (and the fields `status`, `due_at` and `customer.id`), in the StoneOS test stack: real sessions,
// the real HTTP client and the real outbox replayed through `POST /data/batch`. It checks what the queued writes
// (the main way apps write) do when the store refuses one for a duplicate: the refused create is gone, no conflict
// copy appears, the app can read why, and a plain revision conflict still behaves as before.
//
// The backend stack e2e publishes the probe app and runs this file against it:
//
//   APP_DATA_STACK_E2E=1 APP_DATA_PROBE_SLUG=<app> node --import ./test/support/register.mjs --test test/app-data.declared.stack.e2e.test.js
//
// Without APP_DATA_PROBE_SLUG it is skipped. It purges what it creates.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { sessionsOf, clientFor, stackSkipReason } from "./support/stack-clients.mjs";

const PROBE_SLUG = process.env.APP_DATA_PROBE_SLUG;
const SKIP_REASON = stackSkipReason("Set APP_DATA_STACK_E2E=1 and APP_DATA_PROBE_SLUG (an app that declares manifest.data)") || (PROBE_SLUG ? false : "Set APP_DATA_PROBE_SLUG to an app that declares manifest.data");
const RUN = randomBytes(3).toString("hex").toUpperCase();
const numberOf = (suffix) => `E2E-${RUN}-${suffix}`;

const withoutTime = ({ at, ...failure }) => failure;

describe("sdk.data refusals against an app with a unique index", { skip: SKIP_REASON }, () => {
  const stored = [];
  let admin;
  let operator;

  // The invoice is written through the queue, as an app does, and the stored record answered.
  const issue = async (client, suffix, data = {}) => {
    const local = await client.create("invoices", { scope: "app", title: numberOf(suffix), data: { number: numberOf(suffix), status: "open", ...data } });
    await client.flush();
    const record = await client.get(local.id);
    assert.ok(record?.id && !record.id.startsWith("local-"), `${suffix} stored`);
    stored.push({ client, id: record.id });
    return record;
  };

  const titles = async (client, params = {}) => (await client.list("invoices", { scope: "app", pageSize: 100, ...params })).items.map((item) => item.title).filter((title) => title.startsWith(`E2E-${RUN}`)).sort();

  before(() => {
    const [adminSession, operatorSession] = sessionsOf(PROBE_SLUG);
    admin = clientFor(adminSession);
    operator = clientFor(operatorSession);
  });

  after(async () => {
    for (const { client, id } of stored.reverse()) {
      await client.purge(id).catch(() => null);
      await client.flush().catch(() => null);
    }
  });

  it("filters and sorts by declared fields through the client", async () => {
    await issue(admin.client, "A", { status: "open", due_at: 300 });
    await issue(admin.client, "B", { status: "paid", due_at: 100 });
    await issue(admin.client, "C", { status: "open", due_at: 200 });

    assert.deepEqual(await titles(admin.client, { where: { status: "open" }, sort: "data.due_at" }), [numberOf("A"), numberOf("C")].sort());
    const sorted = (await admin.client.list("invoices", { scope: "app", where: { status: "open" }, sort: "data.due_at", pageSize: 100 })).items.map((item) => item.title);
    assert.deepEqual(sorted.filter((title) => title.startsWith(`E2E-${RUN}`)), [numberOf("C"), numberOf("A")]);
    assert.equal((await operator.client.list("invoices", { scope: "app", where: { status: "paid" }, pageSize: 100 })).items.some((item) => item.title === numberOf("B")), true, "the organization reads it");
  });

  it("drops a create refused for a duplicate: no stored record, no conflict, and the app can read why", async () => {
    const { client } = admin;
    const created = await client.create("invoices", { scope: "app", title: `${numberOf("A")} again`, data: { number: numberOf("A"), status: "open" } });

    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0, "the refused write left the outbox");
    assert.equal(status.conflicts, 0, "a duplicate is not a revision conflict");
    assert.deepEqual(status.failures.map(withoutTime), [
      {
        op: "create",
        target_id: created.id,
        status: 409,
        message: status.failures[0].message,
        error_code: "APP_DATA_DUPLICATE",
        collection: "invoices",
        fields: ["number"],
      },
    ]);
    assert.match(status.failures[0].message, /number/);
    assert.deepEqual(await titles(client), [numberOf("A"), numberOf("B"), numberOf("C")].sort(), "the optimistic record is not listed");
    assert.equal(await client.get(created.id), null, "and it is not cached either");

    client.acknowledgeFailures();
    assert.deepEqual(client.status().failures, []);
  });

  it("drops an update and a patch refused for a duplicate, and shows the stored values again", async () => {
    const { client } = admin;
    const first = (await client.list("invoices", { scope: "app", pageSize: 100 })).items.find((item) => item.title === numberOf("B"));

    await client.update(first.id, { data: { ...first.data, number: numberOf("A") } });
    await client.patch(first.id, [{ op: "set", path: "data.number", value: numberOf("C") }]);
    await client.flush();

    const status = client.status();
    assert.equal(status.pending, 0, "no conflict copy was queued");
    assert.equal(status.conflicts, 0);
    assert.deepEqual(
      status.failures.map(({ op, error_code: code, fields }) => ({ op, code, fields })),
      [
        { op: "update", code: "APP_DATA_DUPLICATE", fields: ["number"] },
        { op: "patch", code: "APP_DATA_DUPLICATE", fields: ["number"] },
      ],
    );
    assert.deepEqual(await titles(client), [numberOf("A"), numberOf("B"), numberOf("C")].sort(), "no conflict copy in the list");

    const reread = await client.get(first.id);
    assert.equal(reread.data.number, numberOf("B"), "the stored number, not the refused one");
    client.acknowledgeFailures();
  });

  it("drops the writes queued behind a refused create so they do not block the queue", async () => {
    const { client } = admin;
    const duplicate = await client.create("invoices", { scope: "app", title: "dup", data: { number: numberOf("B") } });
    await client.create("lines", { scope: "app", title: "line", parentId: duplicate.id, data: { amount: 5 } });
    await client.update(duplicate.id, { title: "dup edited" });
    const independent = await client.create("invoices", { scope: "app", title: numberOf("D"), data: { number: numberOf("D"), status: "open" } });

    await client.flush();

    assert.equal(client.status().pending, 0, "nothing waits for an id that never comes");
    assert.deepEqual(
      client.status().failures.map(({ op, error_code: code }) => ({ op, code })),
      [
        { op: "create", code: "APP_DATA_DUPLICATE" },
        { op: "create", code: "APP_DATA_DEPENDENCY_REFUSED" },
        { op: "update", code: "APP_DATA_DEPENDENCY_REFUSED" },
      ],
    );
    const record = await client.get(independent.id);
    assert.ok(record?.id && !record.id.startsWith("local-"), "the independent create was applied");
    stored.push({ client, id: record.id });
    client.acknowledgeFailures();
  });

  it("still raises a revision conflict for a stale update, as before", async () => {
    const { client } = admin;
    const local = await client.create("lines", { scope: "app", title: `E2E-${RUN}-line`, data: { n: 1 } });
    await client.flush();
    const line = await client.get(local.id);
    stored.push({ client, id: line.id });

    await client.patch(line.id, [{ op: "set", path: "data.n", value: 2 }]);
    await client.flush();
    await client.update(line.id, { title: `E2E-${RUN}-line stale` }, { expectedRevision: line.revision });
    await client.flush();

    assert.equal(client.status().conflicts, 1);
    assert.deepEqual(client.status().failures, []);
    assert.equal((await client.get(line.id)).title, `E2E-${RUN}-line`, "the stored record wins");

    const copy = (await client.list("lines", { scope: "app", sort: "-modified", pageSize: 20 })).items.find((item) => /E2E-.*conflict copy/.test(item.title));
    assert.ok(copy, "the edit survives as a copy");
    stored.push({ client, id: copy.id });
    client.acknowledgeConflicts();
  });

  it("raises the conflict of an invoice too, and tells that its copy repeats the unique number", async () => {
    const { client } = admin;
    const record = await issue(client, "E");

    await client.patch(record.id, [{ op: "set", path: "data.status", value: "paid" }]);
    await client.flush();
    await client.update(record.id, { title: `${numberOf("E")} stale` }, { expectedRevision: record.revision });
    await client.flush();

    assert.equal(client.status().conflicts, 1);
    assert.deepEqual(
      client.status().failures.map(({ op, error_code: code, fields }) => ({ op, code, fields })),
      [{ op: "create", code: "APP_DATA_DUPLICATE", fields: ["number"] }],
      "the conflict copy holds the same number, which the unique index refuses",
    );
    assert.equal((await client.get(record.id)).title, numberOf("E"), "the stored record wins");
    client.acknowledgeConflicts();
    client.acknowledgeFailures();
  });

  it("rejects an atomic batch that breaks the unique index and writes nothing", async () => {
    const { client } = admin;
    const before = await titles(client);

    await assert.rejects(
      client.batch([
        { op: "create", collection: "invoices", input: { scope: "app", title: numberOf("F"), data: { number: numberOf("F"), status: "open" } } },
        { op: "create", collection: "invoices", input: { scope: "app", title: "dup", data: { number: numberOf("A"), status: "open" } } },
      ]),
      (error) => error.status === 409 && error.body?.result?.error_code === "APP_DATA_BATCH_ABORTED" && error.body.result.failed_index === 1,
    );
    assert.deepEqual(await titles(client), before, "the first operation rolled back");
  });

  it("refuses paths that reach the prototype chain with 400 and keeps serving", async () => {
    const { http, client } = admin;
    const record = await issue(client, "G");

    for (const operations of [
      [{ op: "set", path: "data.__proto__.polluted", value: "yes" }],
      [
        { op: "set", path: "data.status", value: "paid" },
        { op: "set", path: "data.constructor.prototype.polluted", value: "yes" },
      ],
      [{ op: "merge", path: "data.meta", value: JSON.parse('{"__proto__":{"polluted":"yes"}}') }],
    ]) {
      await assert.rejects(
        http.request({ method: "POST", path: "/app-engine/data/patch", body: { id: record.id, operations } }),
        (error) => error.status === 400 && /not allowed/.test(error.message),
      );
    }

    const untouched = await client.get(record.id);
    assert.equal(untouched.data.status, "open", "no operation of a refused patch applied");

    await client.patch(record.id, [{ op: "set", path: "data.status", value: "paid" }]);
    await client.flush();
    assert.equal((await client.get(record.id)).data.status, "paid", "the store keeps serving patches");
  });
});

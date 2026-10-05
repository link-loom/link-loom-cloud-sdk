// The flows of the StoneOS productivity apps (Notes, To-do, Calendar, Chat, Docs, Sheets, Slides) through the real
// `sdk.data` client against the App Data Store of the StoneOS test stack: real sessions of the seeded admin and
// operator (sessions.mjs), the real HTTP client, the real outbox replayed through `POST /data/batch`. It guards
// that the store keeps the contract the published apps rely on while it gains declared fields, dedicated storage,
// atomic batches and the text search (platform-workloads.md section 4).
//
//   APP_DATA_STACK_E2E=1 node --import ./test/support/register.mjs --test test/app-data.stack.e2e.test.js
//
// Needs the stack running with the apps published (stoneos/tools/build-stack/stack.sh status). Opt-in: it writes
// records, with titles that start with "e2e-compat", and purges every one of them at the end.
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { sessionsOf, clientFor, stackSkipReason } from "./support/stack-clients.mjs";

const SKIP_REASON = stackSkipReason("Set APP_DATA_STACK_E2E=1 (it writes and purges records in the stack)");
const PREFIX = `e2e-compat-${randomBytes(3).toString("hex")}`;

describe("productivity apps through sdk.data against the test stack", { skip: SKIP_REASON }, () => {
  const purgeLater = [];
  const people = {};

  // Creates locally, replays the outbox and answers the stored record.
  const store = async (client, collection, input) => {
    const local = await client.create(collection, { ...input, title: `${PREFIX} ${input.title}` });
    await client.flush();
    const record = await client.get(local.id);
    assert.ok(record?.id && !record.id.startsWith("local-"), `${collection} record stored`);
    purgeLater.push({ client, id: record.id });
    return record;
  };

  // Writes a keyed record, replays the outbox and remembers the stored record to purge it.
  const storeKey = async ({ client, http }, collection, key, data, scope) => {
    await client.setKey(collection, key, data, { scope });
    await client.flush();
    const { record } = await http.request({ path: "/app-engine/data/key", query: { collection, key, scope } });
    assert.ok(record?.id, `${collection}/${key} stored`);
    purgeLater.push({ client, id: record.id });
  };

  const open = (slug) => {
    people[slug] ??= (() => {
      const [admin, operator] = sessionsOf(slug);
      return { admin: clientFor(admin), operator: clientFor(operator) };
    })();
    return people[slug];
  };

  after(async () => {
    for (const { client, id } of purgeLater.reverse()) {
      await client.purge(id).catch(() => null);
      await client.flush().catch(() => null);
    }
  });

  it("Notes: folders and notes, patches, conflict copies, sharing, trash and settings", async () => {
    const { admin, operator } = open("stoneos-notes");
    const folder = await store(admin.client, "notes", { scope: "user-appdata", title: "folder", data: { kind: "folder" }, searchText: "compat folder" });
    const note = await store(admin.client, "notes", {
      scope: "user-appdata",
      title: "note",
      parentId: folder.id,
      data: { html: "<p>hello</p>", pinned: false },
      tags: ["work"],
      searchText: "compat hello",
    });

    const children = await admin.client.list("notes", { parentId: folder.id, scope: "user-appdata", pageSize: 100 });
    assert.deepEqual(
      children.items.map((item) => item.id),
      [note.id],
    );

    await admin.client.patch(note.id, [
      { op: "set", path: "data.pinned", value: true },
      { op: "add-to-set", path: "tags", value: "pinned" },
    ]);
    await admin.client.flush();
    const patched = await admin.client.get(note.id);
    assert.equal(patched.data.pinned, true);
    assert.deepEqual(patched.tags, ["work", "pinned"]);
    assert.equal(patched.revision, note.revision + 1);

    // A stale update keeps the stored record and leaves a visible conflict copy.
    const staleRevision = note.revision;
    await admin.client.update(note.id, { title: `${PREFIX} stale edit` }, { expectedRevision: staleRevision });
    await admin.client.flush();
    assert.equal(admin.client.status().conflicts, 1);
    assert.equal((await admin.client.get(note.id)).title, `${PREFIX} note`);
    const copies = await admin.client.list("notes", { scope: "user-appdata", sort: "-modified", pageSize: 20 });
    const conflictCopy = copies.items.find((item) => item.title.includes("(conflict copy)"));
    assert.ok(conflictCopy, "the conflict copy exists");
    purgeLater.push({ client: admin.client, id: conflictCopy.id });
    admin.client.acknowledgeConflicts();

    const found = await admin.client.search("notes", "hello");
    assert.ok(found.items.some((item) => item.id === note.id), "whole-word search finds the note");

    await admin.client.share(note.id, { visibility: "private", grants: [{ principal_type: "user", principal_id: operator.identity, role: "editor" }] });
    await admin.client.flush();
    const shared = await operator.client.sharedWithMe({ collection: "notes" });
    assert.ok(shared.items.some((item) => item.id === note.id));
    await operator.client.patch(note.id, [{ op: "set", path: "data.html", value: "<p>edited by the operator</p>" }]);
    await operator.client.flush();
    assert.equal((await admin.client.get(note.id)).data.html, "<p>edited by the operator</p>");

    await admin.client.remove(note.id);
    await admin.client.flush();
    const trashed = await admin.client.trash({ collection: "notes" });
    assert.ok(trashed.items.some((item) => item.id === note.id));
    await admin.client.restore(note.id);
    await admin.client.flush();
    assert.equal((await admin.client.get(note.id)).status?.name, "active");

    await storeKey(admin, "notes_settings", `${PREFIX}-prefs`, { sort: "modified" }, "user-appdata");
    assert.deepEqual(await admin.client.getKey("notes_settings", `${PREFIX}-prefs`, { scope: "user-appdata" }), { sort: "modified" });

    const recent = await admin.client.recent({ collection: "notes", limit: 5 });
    assert.ok(recent.items.length > 0 && recent.items.length <= 5);
    await admin.client.resync();
  });

  it("To-do: lists, todos by list, counts, increments and assignment grants", async () => {
    const { admin, operator } = open("stoneos-todo");
    const list = await store(admin.client, "todo_lists", { scope: "app", title: "list", data: { color: "blue", order: 1 } });
    const todo = await store(admin.client, "todos", { scope: "app", title: "todo", refId: list.id, data: { done: false, pomodoros_done: 0 }, searchText: "compat todo" });
    await store(admin.client, "todos", { scope: "app", title: "second", refId: list.id, data: { done: true } });

    const todos = await admin.client.list("todos", { scope: "app", refId: list.id, pageSize: 100 });
    assert.equal(todos.totalItems, 2);
    const count = await admin.client.list("todos", { scope: "app", refId: list.id, countOnly: true });
    assert.deepEqual({ totalItems: count.totalItems }, { totalItems: 2 });

    await admin.client.patch(todo.id, [{ op: "increment", path: "data.pomodoros_done", value: 1 }]);
    await admin.client.patch(todo.id, [{ op: "increment", path: "data.pomodoros_done", value: 1 }]);
    await admin.client.flush();
    assert.equal((await admin.client.get(todo.id)).data.pomodoros_done, 2);

    await admin.client.share(todo.id, { visibility: "private", grants: [{ principal_type: "user", principal_id: operator.identity, role: "editor" }] });
    await admin.client.flush();
    assert.ok((await operator.client.sharedWithMe({ collection: "todos" })).items.some((item) => item.id === todo.id));

    await storeKey(admin, "todo_sync", `${PREFIX}-state`, { items: [] }, "user-appdata");
    assert.deepEqual(await admin.client.getKey("todo_sync", `${PREFIX}-state`, { scope: "user-appdata" }), { items: [] });
  });

  it("Calendar: events by range, RSVPs by event and organization calendars", async () => {
    const { admin, operator } = open("stoneos-calendar");
    const day = Date.UTC(2031, 5, 1);
    const calendar = await store(admin.client, "calendars", { scope: "app", title: "calendar", data: { color: "green" } });
    const event = await store(admin.client, "events", {
      scope: "app",
      title: "event",
      parentId: calendar.id,
      startsAt: day + 9 * 3600 * 1000,
      endsAt: day + 10 * 3600 * 1000,
      data: { all_day: false },
      acl: { visibility: "organization", grants: [] },
    });
    await store(admin.client, "events", { scope: "app", title: "later", startsAt: day + 3 * 24 * 3600 * 1000, data: {} });

    const ranged = await admin.client.range("events", { startsAt: day, endsAt: day + 24 * 3600 * 1000 });
    assert.deepEqual(
      ranged.items.map((item) => item.id),
      [event.id],
    );
    const crossed = await operator.client.range("events", { startsAt: day, endsAt: day + 24 * 3600 * 1000 });
    assert.ok(crossed.items.some((item) => item.id === event.id), "organization events are read by every member");

    const rsvp = await store(operator.client, "rsvps", { scope: "app", title: "rsvp", refId: event.id, data: { status: "accepted" } });
    const rsvps = await admin.client.list("rsvps", { scope: "app", refId: event.id, pageSize: 200 });
    assert.ok(rsvps.items.some((item) => item.id === rsvp.id));

    await admin.client.update(event.id, { startsAt: day + 11 * 3600 * 1000, endsAt: day + 12 * 3600 * 1000 });
    await admin.client.flush();
    const moved = await admin.client.range("events", { startsAt: day, endsAt: day + 10 * 3600 * 1000 });
    assert.equal(moved.items.length, 0, "the event left the earlier window");
  });

  it("Chat: conversations, messages that inherit the access of their conversation, reactions and cursors", async () => {
    const { admin, operator } = open("stoneos-chat");
    const conversation = await store(admin.client, "conversations", {
      scope: "app",
      title: "channel",
      data: { kind: "group", members: [admin.identity, operator.identity] },
      acl: { visibility: "private", grants: [{ principal_type: "user", principal_id: operator.identity, role: "editor" }] },
    });
    const first = await store(admin.client, "messages", { scope: "app", title: "m1", refId: conversation.id, aclSourceId: conversation.id, data: { text: "hello", reactions: {} } });
    await store(operator.client, "messages", { scope: "app", title: "m2", refId: conversation.id, aclSourceId: conversation.id, data: { text: "hi" } });

    const asAdmin = await admin.client.list("messages", { scope: "app", refId: conversation.id, sort: "-created", pageSize: 50 });
    const asOperator = await operator.client.list("messages", { scope: "app", refId: conversation.id, sort: "-created", pageSize: 50 });
    assert.equal(asAdmin.items.length, 2, "the sender sees both messages");
    assert.equal(asOperator.items.length, 2, "the other member sees both messages");
    assert.ok(asAdmin.items[0].created.timestamp >= asAdmin.items[1].created.timestamp, "newest first");

    await operator.client.patch(first.id, [{ op: "increment", path: "data.reactions.thumbs_up", value: 1 }]);
    await operator.client.flush();
    assert.equal((await admin.client.get(first.id)).data.reactions.thumbs_up, 1);

    await admin.client.patch(conversation.id, [{ op: "push-capped", path: "data.pins", value: first.id, max: 3 }]);
    await admin.client.flush();
    assert.deepEqual((await admin.client.get(conversation.id)).data.pins, [first.id]);

    await storeKey(admin, "read_cursors", conversation.id, { last_read: first.id }, "user-appdata");
    assert.deepEqual(await admin.client.getKey("read_cursors", conversation.id, { scope: "user-appdata" }), { last_read: first.id });

    await admin.client.remove(first.id);
    await admin.client.flush();
    const afterRemoval = await operator.client.list("messages", { scope: "app", refId: conversation.id, pageSize: 50 });
    assert.equal(afterRemoval.items.length, 1);
  });

  for (const [slug, collection, revisions] of [
    ["stoneos-docs", "documents", "document_revisions"],
    ["stoneos-sheets", "workbooks", "workbook_versions"],
    ["stoneos-slides", "decks", "deck_revisions"],
  ]) {
    it(`${slug}: documents, revisions by document, large patch batches and sharing`, async () => {
      const { admin, operator } = open(slug);
      const document = await store(admin.client, collection, { scope: "user-appdata", title: "doc", data: { cells: {}, pinned: false }, tags: ["a"], searchText: "compat sheet" });
      await store(admin.client, revisions, { scope: "user-appdata", title: "v1", refId: document.id, data: { snapshot: 1 } });
      await store(admin.client, revisions, { scope: "user-appdata", title: "v2", refId: document.id, data: { snapshot: 2 } });

      const versions = await admin.client.list(revisions, { scope: "user-appdata", refId: document.id, sort: "-created" });
      assert.equal(versions.totalItems, 2);
      assert.equal(versions.items[0].title, `${PREFIX} v2`);

      const operations = Array.from({ length: 100 }, (_, index) => ({ op: "set", path: `data.cells.c${index}`, value: index }));
      await admin.client.patch(document.id, operations);
      await admin.client.patch(document.id, [{ op: "set", path: "data.pinned", value: true }]);
      await admin.client.flush();
      const stored = await admin.client.get(document.id);
      assert.equal(Object.keys(stored.data.cells).length, 100);
      assert.equal(stored.data.pinned, true);

      await admin.client.update(document.id, { title: `${PREFIX} renamed`, tags: ["a", "b"] });
      await admin.client.flush();
      assert.equal((await admin.client.get(document.id)).title, `${PREFIX} renamed`);

      await admin.client.share(document.id, { visibility: "private", grants: [{ principal_type: "user", principal_id: operator.identity, role: "viewer" }] });
      await admin.client.flush();
      const shared = await operator.client.sharedWithMe({ collection });
      assert.ok(shared.items.some((item) => item.id === document.id));
      assert.equal((await operator.client.get(document.id)).title, `${PREFIX} renamed`);
    });
  }
});

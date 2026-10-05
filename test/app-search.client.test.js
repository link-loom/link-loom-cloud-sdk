import { describe, it } from "node:test";
import assert from "node:assert/strict";

import AppSearchClient, { createAppSearchClient } from "../src/features/app-engine/search/app-search.client.js";
import {
  hitContextLine,
  hitEntityLabel,
  hitKey,
  hitRuntimePath,
} from "../src/features/app-engine/search/app-search.utils.js";

const BASE_URL = "https://llc.test";
const SESSION = { token: "test-token", identity: "vp-1", memberships: { active: { organization_id: "org-1" } } };

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

const createClient = ({ respond = () => jsonResponse(200, { success: true, result: { items: [], totalItems: 0, sources: [] } }) } = {}) => {
  const calls = [];
  const client = createAppSearchClient({
    baseUrl: BASE_URL,
    getSession: () => SESSION,
    fetchImpl: async (url, init) => {
      calls.push({ url: new URL(url), ...init });
      return respond(url, init);
    },
  });

  return { client, calls };
};

describe("app search client", () => {
  it("asks the backend as the person, with the identity headers and no app session", async () => {
    const { client, calls } = createClient();

    await client.searchRecords({ text: "  acme corp  ", limit: 10, perAppLimit: 3 });

    const [call] = calls;

    assert.equal(call.method, "GET");
    assert.equal(call.url.origin + call.url.pathname, `${BASE_URL}/app-engine/app-search/records`);
    assert.equal(call.url.searchParams.get("search"), "acme corp");
    assert.equal(call.url.searchParams.get("limit"), "10");
    assert.equal(call.url.searchParams.get("per_app_limit"), "3");
    assert.equal(call.headers.Authorization, "Bearer test-token");
    assert.equal(call.headers["x-veripass-organization-identity"], "org-1");
    assert.equal("x-loom-app-session" in call.headers, false);
    assert.equal(call.url.searchParams.has("organization_id"), false);
  });

  it("does not ask for text the backend would refuse", async () => {
    const { client, calls } = createClient();

    for (const text of [undefined, "", " ", "a", " a "]) {
      assert.deepEqual(await client.searchRecords({ text }), { items: [], totalItems: 0, sources: [] });
    }

    assert.equal(calls.length, 0);
  });

  it("cuts a long text to what the backend accepts", async () => {
    const { client, calls } = createClient();

    await client.searchRecords({ text: "x".repeat(200) });

    assert.equal(calls[0].url.searchParams.get("search").length, 80);
  });

  it("answers the items and the way each app answered", async () => {
    const { client } = createClient({
      respond: () =>
        jsonResponse(200, {
          success: true,
          result: {
            items: [{ id: "rec-1", app_slug: "stoneos-a" }],
            totalItems: 1,
            sources: [{ app_slug: "stoneos-a", status: "ok", count: 1 }],
          },
        }),
    });

    const answer = await client.searchRecords({ text: "acme" });

    assert.equal(answer.items.length, 1);
    assert.deepEqual(answer.sources, [{ app_slug: "stoneos-a", status: "ok", count: 1 }]);
  });

  it("rejects like the runtime client when the backend refuses", async () => {
    const { client } = createClient({
      respond: () => jsonResponse(403, { success: false, status: 403, message: "not a member", result: null }),
    });

    await assert.rejects(client.searchRecords({ text: "acme" }), { name: "RuntimeHttpError", status: 403 });
  });

  it("lists the apps that contribute searchable entities", async () => {
    const { client, calls } = createClient({
      respond: () =>
        jsonResponse(200, { success: true, result: { items: [{ app_slug: "stoneos-a", entities: [] }], totalItems: 1 } }),
    });

    const sources = await client.listSources();

    assert.equal(calls[0].url.pathname, "/app-engine/app-search/sources");
    assert.deepEqual(sources, [{ app_slug: "stoneos-a", entities: [] }]);
  });

  it("answers an empty list for an answer that has no list", async () => {
    const { client } = createClient({ respond: () => jsonResponse(200, { success: true, result: null }) });

    assert.deepEqual(await client.listSources(), []);
    assert.deepEqual((await client.searchRecords({ text: "acme" })).items, []);
  });

  it("is built from any http client", () => {
    assert.ok(new AppSearchClient({ http: {} }));
  });
});

describe("app search results", () => {
  const hit = {
    app_slug: "stoneos-accounting",
    app_name: "Accounting",
    entity_type: "invoice",
    entity_label: "Invoice",
    entity_labels: { en: "Invoice", es: "Factura" },
    id: "inv-1",
    status: { name: "active", title: "Active" },
    deep_link: "/invoices?id=inv-1&customer=cus-9",
  };

  it("opens a result in the runtime of its app, at the record, with its context", () => {
    assert.equal(
      hitRuntimePath(hit),
      "/client/app-engine/runtime/stoneos-accounting/invoices?id=inv-1&customer=cus-9",
    );
    assert.equal(
      hitRuntimePath(hit, "/runtime"),
      "/runtime/stoneos-accounting/invoices?id=inv-1&customer=cus-9",
    );
  });

  it("opens nothing for a malformed result or a link that leaves the app", () => {
    for (const bad of [
      null,
      {},
      { ...hit, app_slug: "" },
      { ...hit, deep_link: "" },
      { ...hit, deep_link: "invoices?id=1" },
      { ...hit, deep_link: "//evil.example" },
      { ...hit, deep_link: "https://evil.example/x" },
      { ...hit, deep_link: "/../work" },
      { ...hit, deep_link: "/invoices/%2e%2e/%2e%2e/work?id=1" },
      { ...hit, deep_link: 7 },
    ]) {
      assert.equal(hitRuntimePath(bad), null);
    }
  });

  it("names the kind of record in the language of the person", () => {
    assert.equal(hitEntityLabel(hit, "es"), "Factura");
    assert.equal(hitEntityLabel(hit, "fr"), "Invoice");
    assert.equal(hitEntityLabel({}, "es"), "");
  });

  it("tells results apart across apps and entities", () => {
    assert.equal(hitKey(hit), "stoneos-accounting:invoice:inv-1");
    assert.notEqual(hitKey(hit), hitKey({ ...hit, app_slug: "stoneos-other" }));
  });

  it("words the context line without gaps", () => {
    assert.equal(hitContextLine(hit, "es"), "Accounting · Factura · Active");
    assert.equal(hitContextLine({ ...hit, status: null }, "en"), "Accounting · Invoice");
    assert.equal(hitContextLine({}, "en"), "");
  });
});

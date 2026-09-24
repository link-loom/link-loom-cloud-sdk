import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  APP_BACKEND_API_VERSION,
  buildAppBackendPrefix,
  createAppBackend,
  createAppBackendClient,
  isValidBackendNamespace,
  resolveBackendNamespace,
} from "../src/features/app-engine/runtime/backend/app-backend.client.js";
import { buildIdentityHeaders, readIdentitySession } from "../src/features/app-engine/runtime/identity/identity-session.js";
import { createLoomClient } from "../src/features/app-engine/runtime/shared/loom-identity.client.js";
import RuntimeHttpClient, { RuntimeHttpError } from "../src/features/app-engine/runtime/shared/runtime-http.client.js";

const APP_SLUG = "stoneos-accounting";
const BASE_URL = "https://llc.test";
const APP_DEFINITION = { slug: APP_SLUG, backend: { namespace: APP_SLUG } };

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

// The runtime chain a host builds: Veripass session → identity headers → RuntimeHttpClient → sdk.loom → sdk.backend.
const createRuntime = ({ respond = () => jsonResponse(200, { success: true, result: { ok: true } }) } = {}) => {
  const calls = [];
  const sessionRef = { current: "ses-1" };
  const identitySession = readIdentitySession({
    token: "test-token",
    identity: "vp-1",
    memberships: { active: { organization_id: "org-1" } },
    payload: { user_id: "usr-1" },
  });
  const fetchImpl = async (url, init) => {
    calls.push({ url, ...init });
    return respond(url, init);
  };
  const loom = createLoomClient(
    new RuntimeHttpClient({
      baseUrl: BASE_URL,
      getHeaders: () => buildIdentityHeaders(identitySession, sessionRef.current),
      fetchImpl,
    }),
  );
  const backend = createAppBackend({ loom, appDefinition: APP_DEFINITION, appSlug: APP_SLUG });
  return { backend, loom, calls, sessionRef };
};

describe("buildAppBackendPrefix", () => {
  it("builds the /apps/<slug>/v1 prefix of the LLC backend", () => {
    assert.equal(APP_BACKEND_API_VERSION, "v1");
    assert.equal(buildAppBackendPrefix(APP_SLUG), "/apps/stoneos-accounting/v1");
  });
});

describe("resolveBackendNamespace", () => {
  it("answers the namespace the definition declares for the app itself", () => {
    assert.equal(resolveBackendNamespace({ appDefinition: APP_DEFINITION, appSlug: APP_SLUG }), APP_SLUG);
  });

  it("falls back to the definition slug when the session carries none", () => {
    assert.equal(resolveBackendNamespace({ appDefinition: APP_DEFINITION }), APP_SLUG);
  });

  it("answers null for an app without backend", () => {
    assert.equal(resolveBackendNamespace({ appDefinition: { slug: APP_SLUG }, appSlug: APP_SLUG }), null);
    assert.equal(resolveBackendNamespace({ appDefinition: { slug: APP_SLUG, backend: null }, appSlug: APP_SLUG }), null);
    assert.equal(resolveBackendNamespace({ appDefinition: null, appSlug: APP_SLUG }), null);
    assert.equal(resolveBackendNamespace(), null);
  });

  it("ignores a namespace that is not a slug", () => {
    for (const namespace of ["", "Stoneos-Accounting", "stoneos accounting", "../security", "stoneos-", 42, {}]) {
      assert.equal(resolveBackendNamespace({ appDefinition: { slug: APP_SLUG, backend: { namespace } }, appSlug: APP_SLUG }), null);
    }
  });

  it("ignores the namespace of another app", () => {
    const appDefinition = { slug: "stoneos-notes", backend: { namespace: APP_SLUG } };
    assert.equal(resolveBackendNamespace({ appDefinition, appSlug: "stoneos-notes" }), null);
  });

  it("validates namespace slugs", () => {
    assert.equal(isValidBackendNamespace("stoneos-accounting"), true);
    assert.equal(isValidBackendNamespace("app2"), true);
    assert.equal(isValidBackendNamespace("-app"), false);
    assert.equal(isValidBackendNamespace("app--x"), false);
  });
});

describe("createAppBackend", () => {
  it("gives no client to an app without a declared namespace", () => {
    const { loom } = createRuntime();
    assert.equal(createAppBackend({ loom, appDefinition: { slug: APP_SLUG }, appSlug: APP_SLUG }), null);
  });

  it("gives no client without the authenticated loom client", () => {
    assert.equal(createAppBackend({ loom: null, appDefinition: APP_DEFINITION, appSlug: APP_SLUG }), null);
  });

  it("exposes the namespace, its prefix and its base URL, and cannot be changed by the app", () => {
    const { backend } = createRuntime();
    assert.equal(backend.namespace, APP_SLUG);
    assert.equal(backend.prefix, "/apps/stoneos-accounting/v1");
    assert.equal(backend.baseUrl, `${BASE_URL}/apps/stoneos-accounting/v1`);
    assert.equal(Object.isFrozen(backend), true);
    assert.throws(() => {
      backend.prefix = "/security";
    }, TypeError);
  });

  it("reads the identity headers of sdk.loom", () => {
    const { backend } = createRuntime();
    assert.deepEqual(backend.headers(), {
      Authorization: "Bearer test-token",
      "x-veripass-organization-identity": "org-1",
      "x-loom-app-session": "ses-1",
    });
  });
});

describe("sdk.backend requests", () => {
  it("calls the app namespace with the identity headers app-session expects", async () => {
    const { backend, calls } = createRuntime({
      respond: () => jsonResponse(200, { success: true, status: 200, result: { items: [{ id: "je-1" }] } }),
    });

    const result = await backend.get("/journal-entry/by-period", { period: "2026-09" });

    assert.deepEqual(result, { items: [{ id: "je-1" }] });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/by-period?period=2026-09`);
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].headers.Authorization, "Bearer test-token");
    assert.equal(calls[0].headers["x-veripass-organization-identity"], "org-1");
    assert.equal(calls[0].headers["x-loom-app-session"], "ses-1");
  });

  it("sends a flat query object as URL parameters", async () => {
    const { backend, calls } = createRuntime();

    await backend.get("/record/all", { page: 2, pageSize: 20, archived: false, ids: ["r-1", "r-2"], search: undefined });

    assert.equal(calls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/record/all?page=2&pageSize=20&archived=false&ids=r-1%2Cr-2`);
  });

  it("refuses a query key holding an object, such as the axios form { params }, before any request", async () => {
    const { backend, calls } = createRuntime();
    const period = "2026-09";

    await assert.rejects(backend.get("/journal-entry/by-period", { params: { period } }), (error) => {
      assert.ok(error instanceof TypeError);
      assert.match(error.message, /"params" holds an object/);
      assert.match(error.message, /sdk\.backend\.get\('\/journal-entry\/by-period', \{ period \}\)/);
      return true;
    });

    for (const query of [{ filter: Object.create(null) }, { ids: [{ id: "r-1" }] }, "period=2026-09", ["2026-09"], 42]) {
      await assert.rejects(backend.get("/journal-entry/by-period", query), TypeError, `query ${JSON.stringify(query)} must be refused`);
    }

    assert.equal(calls.length, 0);
  });

  it("runs the documented call of docs/05-sdk-contract.md as the flat query it describes", async () => {
    const contract = await readFile(new URL("../docs/05-sdk-contract.md", import.meta.url), "utf8");
    const [documentedCall] = contract.match(/^const entries = await sdk\.backend\.get\(.*\);$/m) || [];
    assert.ok(documentedCall, "docs/05-sdk-contract.md documents a sdk.backend.get call");

    const { backend, calls } = createRuntime();
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
    const runDocumentedCall = new AsyncFunction("sdk", "period", `${documentedCall}\nreturn entries;`);

    assert.deepEqual(await runDocumentedCall({ backend }, "2026-09"), { ok: true });
    assert.equal(calls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/by-period?period=2026-09`);
  });

  it("sends writes with their method and JSON body", async () => {
    const { backend, calls } = createRuntime();

    await backend.post("/journal-entry/", { period: "2026-09" });
    await backend.patch("/journal-entry/", { id: "je-1", memo: "Close" });
    await backend.delete("/journal-entry/", { id: "je-1" });

    assert.deepEqual(
      calls.map(({ url, method, body, headers }) => ({ url, method, body, contentType: headers["Content-Type"] })),
      [
        { url: `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/`, method: "POST", body: '{"period":"2026-09"}', contentType: "application/json" },
        { url: `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/`, method: "PATCH", body: '{"id":"je-1","memo":"Close"}', contentType: "application/json" },
        { url: `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/`, method: "DELETE", body: '{"id":"je-1"}', contentType: "application/json" },
      ],
    );
  });

  it("reads the app session per request (an offline session reopened online)", async () => {
    const { backend, calls, sessionRef } = createRuntime();

    sessionRef.current = null;
    await backend.get("/record/all");
    sessionRef.current = "ses-2";
    await backend.get("/record/all");

    assert.equal(calls[0].headers["x-loom-app-session"], undefined);
    assert.equal(calls[1].headers["x-loom-app-session"], "ses-2");
  });

  it("prefixes a path written without its leading slash and keeps its query", async () => {
    const { backend, calls } = createRuntime();

    await backend.get("record/all?page=2");

    assert.equal(calls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/record/all?page=2`);
  });

  it("passes the abort signal through", async () => {
    const { backend, calls } = createRuntime();
    const controller = new AbortController();

    await backend.get("/record/all", undefined, { signal: controller.signal });

    assert.equal(calls[0].signal, controller.signal);
  });

  it("rejects with the backend answer, as sdk.loom does", async () => {
    const { backend } = createRuntime({
      respond: () => jsonResponse(403, { success: false, status: 403, message: "Session of another app" }),
    });

    await assert.rejects(backend.get("/record/all"), (error) => {
      assert.ok(error instanceof RuntimeHttpError);
      assert.equal(error.status, 403);
      assert.equal(error.message, "Session of another app");
      return true;
    });
  });

  it("never leaves the app namespace", async () => {
    const { backend, calls } = createRuntime();
    const escapes = [
      "../security/keys",
      "/record/../../security",
      "/record/%2E%2E/x",
      "/record/.%2e/x",
      "/record/./x",
      "/record\\..\\x",
      "",
      null,
      42,
    ];

    for (const path of escapes) {
      await assert.rejects(backend.get(path), TypeError, `path ${String(path)} must be refused`);
      await assert.rejects(backend.post(path, {}), TypeError);
    }

    assert.equal(calls.length, 0);
  });

  it("allows dots inside a segment and in the query", async () => {
    const { backend, calls } = createRuntime();

    await backend.get("/document/report.v2.pdf?from=../x");

    assert.equal(calls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/document/report.v2.pdf?from=../x`);
  });
});

describe("createAppBackendClient", () => {
  it("needs the loom client and a namespace slug", () => {
    const { loom } = createRuntime();
    assert.throws(() => createAppBackendClient({ loom: null, namespace: APP_SLUG }), /sdk\.loom/);
    assert.throws(() => createAppBackendClient({ loom, namespace: "Not A Slug" }), /namespace slug/);
  });
});

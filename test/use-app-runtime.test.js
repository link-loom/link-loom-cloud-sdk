import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import useAppRuntime from "../src/features/app-engine/hooks/useAppRuntime.jsx";

const APP_SLUG = "stoneos-accounting";
const BASE_URL = "https://llc.test";
const APP_MODULE_SOURCE = "export default function App() { return null; }";
const IDENTITY_SESSION = {
  token: "test-token",
  identity: "vp-1",
  memberships: { active: { organization_id: "org-1" } },
  payload: { user_id: "usr-1" },
};

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

// The App Engine session service of a host: `open` answers the session, the app definition and the build.
const createAppSessionService = ({ appDefinition }) => ({
  serviceEndpoints: { baseUrl: BASE_URL },
  open: async (payload) => ({
    result: {
      session: {
        id: "ses-1",
        app_slug: payload.app_slug,
        app_definition_id: "def-1",
        app_version_id: "ver-1",
        launch_mode: payload.launch_mode,
        route_path: payload.route_path,
      },
      app_definition: appDefinition,
      app_version: { build_artifact: { "app.js": { content: APP_MODULE_SOURCE } } },
    },
  }),
});

// Server rendering runs the hook once and no effects, which is all `openApp` needs.
const renderAppRuntime = (props) => {
  let runtime = null;
  const Harness = () => {
    runtime = useAppRuntime(props);
    return null;
  };

  renderToString(createElement(Harness));
  return runtime;
};

const openApp = async ({ appDefinition }) => {
  const runtime = renderAppRuntime({
    appSessionService: createAppSessionService({ appDefinition }),
    getIdentitySession: () => IDENTITY_SESSION,
  });

  return runtime.openApp({ appSlug: APP_SLUG, routePath: "/", launchMode: "fullscreen" });
};

describe("useAppRuntime sdk.backend", () => {
  const originals = {};
  let fetchCalls;

  beforeEach(() => {
    fetchCalls = [];
    originals.createObjectURL = URL.createObjectURL;
    originals.revokeObjectURL = URL.revokeObjectURL;
    originals.fetch = globalThis.fetch;

    // Node cannot import a Blob URL; the build artifact is handed out as a data: URL of the same source.
    URL.createObjectURL = () => `data:text/javascript,${encodeURIComponent(APP_MODULE_SOURCE)}`;
    URL.revokeObjectURL = () => {};
    globalThis.fetch = async (url, init) => {
      fetchCalls.push({ url, ...init });
      return jsonResponse(200, { success: true, status: 200, result: { items: [] } });
    };
  });

  afterEach(() => {
    URL.createObjectURL = originals.createObjectURL;
    URL.revokeObjectURL = originals.revokeObjectURL;
    globalThis.fetch = originals.fetch;
  });

  it("gives sdk.backend to an app whose definition declares its namespace", async () => {
    const opened = await openApp({ appDefinition: { slug: APP_SLUG, backend: { namespace: APP_SLUG } } });

    assert.ok(opened, "openApp answers the app and its sdk");
    const { AppComponent, sdk } = opened;
    assert.equal(typeof AppComponent, "function");
    assert.equal(sdk.backend.prefix, "/apps/stoneos-accounting/v1");
    assert.equal(sdk.backend.baseUrl, `${BASE_URL}/apps/stoneos-accounting/v1`);
    assert.equal(Object.isFrozen(sdk.backend), true);
    assert.deepEqual(sdk.backend.headers(), {
      Authorization: "Bearer test-token",
      "x-veripass-organization-identity": "org-1",
      "x-loom-app-session": "ses-1",
    });

    const result = await sdk.backend.get("/journal-entry/by-period", { period: "2026-09" });

    assert.deepEqual(result, { items: [] });
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, `${BASE_URL}/apps/stoneos-accounting/v1/journal-entry/by-period?period=2026-09`);
    assert.equal(fetchCalls[0].headers.Authorization, "Bearer test-token");
    assert.equal(fetchCalls[0].headers["x-veripass-organization-identity"], "org-1");
    assert.equal(fetchCalls[0].headers["x-loom-app-session"], "ses-1");
  });

  it("leaves sdk.backend out for an app without a declared namespace", async () => {
    const { sdk } = await openApp({ appDefinition: { slug: APP_SLUG } });

    assert.equal("backend" in sdk, false);
    assert.equal(sdk.session.appSlug, APP_SLUG);
  });

  it("leaves sdk.backend out when the definition names the namespace of another app", async () => {
    const { sdk } = await openApp({ appDefinition: { slug: APP_SLUG, backend: { namespace: "stoneos-notes" } } });

    assert.equal("backend" in sdk, false);
  });
});

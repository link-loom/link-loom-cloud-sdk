// What the e2e tests that run against the StoneOS test stack share: the stack's LLC, the real app sessions of the
// seeded admin and operator (sessions.mjs) and the client every app of the platform runs (`sdk.data` over the real
// HTTP client). Sessions and keys stay in memory and are never printed.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AppDataClient from "../../src/features/app-engine/runtime/data/data-client.js";
import RuntimeHttpClient from "../../src/features/app-engine/runtime/shared/runtime-http.client.js";

export const LLC_URL = process.env.LLC_STACK_URL || "http://localhost:3191";
const BUILD_STACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..", "stoneos", "tools", "build-stack");

// Why a stack e2e does not run, or false when it can.
export const stackSkipReason = (reason) =>
  !process.env.APP_DATA_STACK_E2E
    ? reason
    : !existsSync(path.join(BUILD_STACK, ".state", "stack.json"))
      ? "The StoneOS test stack is not running (stoneos/tools/build-stack/stack.sh start)"
      : false;

// The app sessions of the seeded admin and operator for a published app. sessions.mjs writes them to a private file
// that is read and deleted at once.
export const sessionsOf = (slug) => {
  const outputFile = path.join(tmpdir(), `app-data-stack-${randomBytes(8).toString("hex")}.json`);
  try {
    const result = spawnSync(process.execPath, [path.join(BUILD_STACK, "sessions.mjs"), "both", "--app", slug, "--json", "--out", outputFile], {
      cwd: BUILD_STACK,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(`sessions.mjs ${slug} failed: ${(result.stderr || "").slice(-400)}`);
    }
    return JSON.parse(readFileSync(outputFile, "utf8"));
  } finally {
    rmSync(outputFile, { force: true });
  }
};

// One person in one app, with the client every app of the platform runs.
export const clientFor = (session) => {
  const http = new RuntimeHttpClient({ baseUrl: LLC_URL, getHeaders: () => session.app.app_session_headers, fetchImpl: globalThis.fetch.bind(globalThis) });
  const client = new AppDataClient({
    http,
    appSlug: session.app.slug,
    veripassIdentity: session.veripass_identity,
    organizationId: session.organization_id,
    isOnline: () => true,
  });
  return { client, http, identity: session.veripass_identity };
};

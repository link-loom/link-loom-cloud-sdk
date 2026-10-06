import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  LAUNCHPAD_PATHS,
  STONEOS_LAUNCHPAD_SEGMENTS,
  buildLaunchpadPaths,
} from "../src/components/app-engine/defaults/launchpad.defaults.js";

describe("buildLaunchpadPaths", () => {
  it("puts the four routes under the host's base path", () => {
    const paths = buildLaunchpadPaths("/admin");

    assert.equal(paths.apps, "/admin/stoneos/apps");
    assert.equal(paths.store, "/admin/stoneos/store");
    assert.equal(paths.runtime("stoneos-notes"), "/admin/app-engine/runtime/stoneos-notes");
    assert.equal(paths.studio("abc"), "/admin/app-engine/studio/abc");
  });

  it("ignores a trailing slash in the base path", () => {
    assert.equal(buildLaunchpadPaths("/client/").apps, "/client/stoneos/apps");
  });

  it("builds the paths without a prefix when the host gives no base path", () => {
    assert.equal(buildLaunchpadPaths().apps, "/stoneos/apps");
    assert.equal(buildLaunchpadPaths(null).store, "/stoneos/store");
  });

  it("keeps the default paths a host without a base path has always had", () => {
    assert.equal(LAUNCHPAD_PATHS.apps, "/stoneos/apps");
    assert.equal(LAUNCHPAD_PATHS.store, "/stoneos/store");
    assert.equal(LAUNCHPAD_PATHS.runtime("x"), "/app-engine/runtime/x");
    assert.equal(LAUNCHPAD_PATHS.studio("1"), "/app-engine/studio/1");
  });

  it("uses the same segments the routes are mounted on", () => {
    const { section, apps, store } = STONEOS_LAUNCHPAD_SEGMENTS;

    assert.equal(buildLaunchpadPaths("/x").apps, `/x/${section}/${apps}`);
    assert.equal(buildLaunchpadPaths("/x").store, `/x/${section}/${store}`);
  });
});

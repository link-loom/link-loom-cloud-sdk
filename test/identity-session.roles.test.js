import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSdkIdentity, readIdentitySession } from "../src/features/app-engine/runtime/identity/identity-session.js";

const session = (payload) =>
  readIdentitySession({
    token: "test-token",
    identity: "vp-1",
    memberships: {
      active: { organization_id: "org-1" },
      items: [{ organization_id: "org-1" }, { organization_id: "org-2" }],
    },
    payload: { user_id: "usr-1", ...payload },
  });

describe("sdk.identity roles", () => {
  it("exposes the role names of the active organization and the role of each membership", () => {
    const identity = buildSdkIdentity(
      session({
        roles: [
          { organization_id: "org-1", context: { role: { name: "Accountant" } } },
          { organization_id: "org-2", context: { role: { name: "Viewer" } } },
          { organization_id: "org-1", role_slug: "approver" },
        ],
      }),
    );

    assert.deepEqual(identity.roles, ["Accountant", "approver"]);
    assert.equal(identity.memberships[0].role, "Accountant");
    assert.equal(identity.memberships[1].role, "Viewer");
  });

  it("answers no roles when the session carries none", () => {
    const identity = buildSdkIdentity(session({}));

    assert.deepEqual(identity.roles, []);
    assert.equal(identity.memberships[0].role, undefined);
  });
});

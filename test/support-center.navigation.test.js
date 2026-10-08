import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  SUPPORT_ACTIONS,
  SUPPORT_SEGMENTS,
  SUPPORT_SUB_PAGES,
  resolveActionRoute,
} from "../src/components/support/center/support-center.navigation.js";

describe("resolveActionRoute", () => {
  it("sends the actions that start a case to the new case form", () => {
    for (const action of [
      SUPPORT_ACTIONS.REPORT_ISSUE,
      SUPPORT_ACTIONS.REQUEST_HELP,
      SUPPORT_ACTIONS.CATEGORY_SELECT,
      SUPPORT_ACTIONS.ASSISTANT_ESCALATE,
    ]) {
      assert.equal(resolveActionRoute(action), "/new-case", action);
    }
  });

  it("sends the actions that look for cases or incidents to the case list", () => {
    for (const action of [
      SUPPORT_ACTIONS.VIEW_INCIDENTS,
      SUPPORT_ACTIONS.VIEW_ALL_CASES,
      SUPPORT_ACTIONS.VIEW_STATUS_PAGE,
      SUPPORT_ACTIONS.INCIDENT_VIEW,
    ]) {
      assert.equal(resolveActionRoute(action), "/cases", action);
    }
  });

  it("opens the assistant and the category list", () => {
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.ASK_ASSISTANT), "/assistant");
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.ASSISTANT_OPEN), "/assistant");
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.BROWSE_ALL_CATEGORIES), "/categories");
  });

  it("brings the person back to the hub", () => {
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.BACK_TO_HUB), "/hub");
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.GUIDE_LIST), "/hub");
  });

  it("opens a case by its id", () => {
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.CASE_CLICK, { supportCase: { id: "c-1" } }), "/case/c-1");
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.CASE_VIEW, { supportCase: { id: "c-2" } }), "/case/c-2");
  });

  it("opens a guide by its slug", () => {
    assert.equal(resolveActionRoute(SUPPORT_ACTIONS.GUIDE_CLICK, { guide: { slug: "reset-password" } }), "/guide/reset-password");
  });

  it("stays on the page for the actions that only change the center", () => {
    for (const action of [
      SUPPORT_ACTIONS.CASE_CREATE,
      SUPPORT_ACTIONS.CASE_UPDATE_STATUS,
      SUPPORT_ACTIONS.CASE_RESOLVE,
      SUPPORT_ACTIONS.CASE_CLOSE,
      SUPPORT_ACTIONS.CASE_DELETE,
      SUPPORT_ACTIONS.CASE_REPLY,
      SUPPORT_ACTIONS.CASE_UPDATE_METADATA,
      SUPPORT_ACTIONS.DIAGNOSTICS_VIEW,
    ]) {
      assert.equal(resolveActionRoute(action, {}), null, action);
    }
  });

  it("ignores an action that is not one of the center's", () => {
    assert.equal(resolveActionRoute("somebody-else::open"), null);
    assert.equal(resolveActionRoute(undefined), null);
  });

  it("only routes to segments the center has", () => {
    const segments = new Set(Object.values(SUPPORT_SEGMENTS));

    for (const action of Object.values(SUPPORT_ACTIONS)) {
      const route = resolveActionRoute(action, { supportCase: { id: "x" }, guide: { slug: "y" } });
      if (route) assert.ok(segments.has(route.split("/")[1]), `${action} -> ${route}`);
    }
  });
});

describe("support center vocabulary", () => {
  it("namespaces every action under link-loom-support", () => {
    assert.ok(Object.values(SUPPORT_ACTIONS).every((action) => action.startsWith("link-loom-support::")));
  });

  it("gives each sub-page one id for the host's bridge", () => {
    const ids = Object.values(SUPPORT_SUB_PAGES);

    assert.equal(ids.length, 8);
    assert.equal(new Set(ids).size, 8);
    assert.ok(Object.isFrozen(SUPPORT_SUB_PAGES));
  });
});

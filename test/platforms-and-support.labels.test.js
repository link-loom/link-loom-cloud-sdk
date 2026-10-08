import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { APPS_MENU_LABELS } from "../src/features/app-engine/platforms/apps-menu.items.js";
import { PLATFORM_HUB_LABELS } from "../src/components/app-engine/platforms/platform-hub.labels.js";
import { SUPPORT_CENTER_LABELS } from "../src/components/support/center/support-center.labels.js";

// The shape of a label tree: where each leaf is, and whether it is text or a function with its arity.
const shapeOf = (node) => {
  if (typeof node === "function") return `fn/${node.length}`;
  if (typeof node === "string") return "text";

  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, shapeOf(value)]));
};

const leavesOf = (node, path = "") => {
  if (typeof node !== "object") return [[path, node]];

  return Object.entries(node).flatMap(([key, value]) => leavesOf(value, path ? `${path}.${key}` : key));
};

describe("label sets", () => {
  for (const [name, labels] of Object.entries({
    PLATFORM_HUB_LABELS,
    SUPPORT_CENTER_LABELS,
    APPS_MENU_LABELS,
  })) {
    it(`${name} has the same keys in English and Spanish`, () => {
      assert.deepEqual(shapeOf(labels.es), shapeOf(labels.en));
    });

    it(`${name} has no empty copy`, () => {
      for (const locale of ["en", "es"]) {
        for (const [path, leaf] of leavesOf(labels[locale])) {
          const text = typeof leaf === "function" ? leaf("Veripass") : leaf;
          assert.ok(typeof text === "string" && text.trim().length > 0, `${locale}.${path}`);
        }
      }
    });
  }

  it("names the platform in the copy that takes a name", () => {
    for (const locale of ["en", "es"]) {
      assert.ok(PLATFORM_HUB_LABELS[locale].portal.title("Veripass").includes("Veripass"));
      assert.ok(PLATFORM_HUB_LABELS[locale].helpCenter.description("Veripass").includes("Veripass"));
      assert.ok(PLATFORM_HUB_LABELS[locale].comingSoon.description("Identity").includes("Identity"));
    }
  });

  it("writes Spanish without the voseo", () => {
    const spanish = JSON.stringify([leavesOf(SUPPORT_CENTER_LABELS.es), leavesOf(APPS_MENU_LABELS.es)]) +
      leavesOf(PLATFORM_HUB_LABELS.es).map(([, leaf]) => (typeof leaf === "function" ? leaf("X") : leaf)).join(" ");

    assert.ok(!/\b(vos|tenés|querés|podés|hacé|mirá|elegí)\b/i.test(spanish));
  });
});

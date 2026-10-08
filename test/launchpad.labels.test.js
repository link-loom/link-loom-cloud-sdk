import { test } from "node:test";
import assert from "node:assert/strict";

import { APP_STORE_LABELS, LAUNCHPAD_LABELS } from "../src/components/app-engine/defaults/launchpad.defaults.js";
import {
  APP_STORE_LABELS_ES,
  LAUNCHPAD_LABELS_ES,
  appStoreLabels,
  launchpadLabels,
} from "../src/components/app-engine/defaults/launchpad.labels.js";

const shapeOf = (tree, prefix = "") =>
  Object.entries(tree).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value) ? shapeOf(value, `${prefix}${key}.`) : [`${prefix}${key}:${typeof value}`]
  );

test("the Spanish launchpad copy covers every English key with the same kind of value", () => {
  const missing = shapeOf(LAUNCHPAD_LABELS).filter((entry) => !shapeOf(LAUNCHPAD_LABELS_ES).includes(entry));
  assert.deepEqual(missing, []);
});

test("the Spanish App Store copy covers every English key with the same kind of value", () => {
  const missing = shapeOf(APP_STORE_LABELS).filter((entry) => !shapeOf(APP_STORE_LABELS_ES).includes(entry));
  assert.deepEqual(missing, []);
});

test("labels by locale fall back to English", () => {
  assert.equal(launchpadLabels("es"), LAUNCHPAD_LABELS_ES);
  assert.equal(appStoreLabels("fr"), APP_STORE_LABELS);
  assert.equal(launchpadLabels().myApps, "My apps");
});

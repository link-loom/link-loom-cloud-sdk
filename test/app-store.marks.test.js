import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { categoryMarkColor, initialsOf, markColorFor, suiteMarkColor } from "../src/features/app-engine/app-store/app-store.format.js";
import { STORE_CATEGORY_MARK_COLORS, STORE_MARK_COLORS } from "../src/components/app-engine/defaults/stoneos-store.palette.js";
import { STORE_CATEGORIES } from "../src/features/app-engine/app-store/app-store.enums.js";

describe("the initials of a mark", () => {
  it("takes the first two letters of a one-word title", () => {
    assert.equal(initialsOf("Finance"), "FI");
    assert.equal(initialsOf("ai"), "AI");
  });

  it("takes the first letter of each of the first two words otherwise", () => {
    assert.equal(initialsOf("Human Resources"), "HR");
    assert.equal(initialsOf("Supply  chain management"), "SC");
  });

  it("reads accents and a one-letter title without breaking", () => {
    assert.equal(initialsOf("Operación"), "OP");
    assert.equal(initialsOf("X"), "X");
  });

  it("is empty when there is no title", () => {
    assert.equal(initialsOf(""), "");
    assert.equal(initialsOf(undefined), "");
  });
});

describe("the colour of a mark", () => {
  it("gives each category of the catalog a colour of its own", () => {
    const colors = Object.values(STORE_CATEGORIES).map((name) => categoryMarkColor({ name }));

    assert.equal(new Set(colors).size, colors.length);
    assert.deepEqual(Object.keys(STORE_CATEGORY_MARK_COLORS).sort(), Object.keys(STORE_CATEGORIES).sort());
  });

  it("gives a category the catalog adds later the same colour every time, from the palette", () => {
    const first = categoryMarkColor({ name: "logistics" });

    assert.equal(categoryMarkColor({ name: "logistics" }), first);
    assert.ok(STORE_MARK_COLORS.includes(first));
    assert.equal(markColorFor("logistics"), first);
  });

  it("keeps the colour a suite came with and gives one by slug to a suite that did not", () => {
    assert.equal(suiteMarkColor({ slug: "finance", color: "#1565c0" }), "#1565c0");
    assert.equal(suiteMarkColor({ slug: "finance" }), suiteMarkColor({ slug: "finance" }));
    assert.ok(STORE_MARK_COLORS.includes(suiteMarkColor({ slug: "finance" })));
  });
});

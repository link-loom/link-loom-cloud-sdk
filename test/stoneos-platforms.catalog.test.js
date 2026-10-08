import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_HIDDEN_PLATFORMS,
  STONEOS_PLATFORMS,
  platformIconSrc,
  platformLabels,
  platformsForSettings,
} from "../src/components/app-engine/defaults/stoneos-platforms.catalog.js";

const byId = (id) => STONEOS_PLATFORMS.find((entry) => entry.id === id);

describe("STONEOS_PLATFORMS", () => {
  it("lists the nine platforms in the order of the ecosystem", () => {
    assert.deepEqual(
      STONEOS_PLATFORMS.map((entry) => entry.id),
      ["linkloom", "veripass", "sommatic", "vectry", "hivora", "vca", "miretail", "micampus", "etrune"],
    );
  });

  it("has no repeated id, color or icon", () => {
    for (const field of ["id", "color", "icon"]) {
      const values = STONEOS_PLATFORMS.map((entry) => entry[field]);
      assert.equal(new Set(values).size, values.length, `${field} repeats`);
    }
  });

  it("is frozen, entries and labels included", () => {
    assert.ok(Object.isFrozen(STONEOS_PLATFORMS));
    assert.ok(STONEOS_PLATFORMS.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.labels.en) && Object.isFrozen(entry.labels.es)));
  });

  it("names every platform by the capability it gives, in both languages", () => {
    const capabilities = Object.fromEntries(STONEOS_PLATFORMS.map((entry) => [entry.id, [entry.labels.en.capability, entry.labels.es.capability]]));

    assert.deepEqual(capabilities, {
      linkloom: ["Applications", "Aplicaciones"],
      veripass: ["Identity", "Identidad"],
      sommatic: ["Intelligence", "Inteligencia"],
      vectry: ["Analytics", "Analítica"],
      hivora: ["Devices", "Dispositivos"],
      vca: ["Finance", "Finanzas"],
      miretail: ["Operations", "Operaciones"],
      micampus: ["Learning", "Aprendizaje"],
      etrune: ["Retail", "Comercio"],
    });
  });

  it("keeps the same fields in English and Spanish, none of them empty", () => {
    for (const entry of STONEOS_PLATFORMS) {
      assert.deepEqual(Object.keys(entry.labels.es).sort(), Object.keys(entry.labels.en).sort(), entry.id);

      for (const locale of ["en", "es"]) {
        for (const [field, value] of Object.entries(entry.labels[locale])) {
          assert.ok(typeof value === "string" && value.trim().length > 0, `${entry.id}.${locale}.${field}`);
        }
      }
    }
  });

  it("describes each platform in one sentence", () => {
    for (const entry of STONEOS_PLATFORMS) {
      for (const locale of ["en", "es"]) {
        const { description } = entry.labels[locale];
        assert.ok(description.endsWith("."), `${entry.id}.${locale} ends without a period`);
        assert.equal(description.split(". ").length, 1, `${entry.id}.${locale} is more than one sentence`);
      }
    }
  });

  it("spells Hivora without an accent, in every field", () => {
    assert.ok(!JSON.stringify(STONEOS_PLATFORMS).includes("Hívora"));
    assert.equal(byId("hivora").labels.en.name, "Hivora Dynamics");
  });

  it("keeps the brand name the same in both languages", () => {
    for (const entry of STONEOS_PLATFORMS) {
      assert.equal(entry.labels.es.name, entry.labels.en.name, entry.id);
    }
  });

  it("gives each platform a hex color, an svg icon file name and an https portal", () => {
    for (const entry of STONEOS_PLATFORMS) {
      assert.match(entry.color, /^#[0-9a-fA-F]{6}$/, entry.id);
      assert.match(entry.icon, /^[a-z-]+\.svg$/, entry.id);
      assert.match(entry.portalUrl, /^https:\/\//, entry.id);
    }
  });

  it("takes color and icon from the Mi Retail platform list, and Êtrune's from its own brand", () => {
    assert.deepEqual(
      STONEOS_PLATFORMS.map((entry) => [entry.id, entry.color, entry.icon]),
      [
        ["linkloom", "#1FA9C4", "link-loom.svg"],
        ["veripass", "#E4536A", "veripass.svg"],
        ["sommatic", "#6E56CF", "sommatic.svg"],
        ["vectry", "#DB3860", "vectry.svg"],
        ["hivora", "#0E7C66", "hivora.svg"],
        ["vca", "#3B1F9E", "vca.svg"],
        ["miretail", "#3c4876", "mi-retail.svg"],
        ["micampus", "#3902D7", "mi-campus.svg"],
        ["etrune", "#563e2e", "etrune.svg"],
      ],
    );
  });

  it("points each platform at its portal", () => {
    assert.deepEqual(Object.fromEntries(STONEOS_PLATFORMS.map((entry) => [entry.id, entry.portalUrl])), {
      linkloom: "https://linkloom.io",
      veripass: "https://veripass.com.co",
      sommatic: "https://sommatic.ai",
      vectry: "https://vectry.io",
      hivora: "https://hivoradynamics.com",
      vca: "https://www.virtualcapitalofamerica.com",
      miretail: "https://miretail.com.co",
      micampus: "https://micampusapp.com",
      etrune: "https://etrune.com",
    });
  });

  it("names the support namespace after the platform and has no StoneOS app yet", () => {
    for (const entry of STONEOS_PLATFORMS) {
      assert.equal(entry.supportNamespaceSlug, entry.id);
      assert.equal(entry.stoneosAppSlug, null);
    }
  });

  it("keeps the English capability on the entry itself", () => {
    for (const entry of STONEOS_PLATFORMS) {
      assert.equal(entry.capability, entry.labels.en.capability);
    }
  });
});

describe("platformsForSettings", () => {
  it("hides Êtrune unless asked otherwise", () => {
    const ids = platformsForSettings().map((entry) => entry.id);

    assert.equal(ids.length, 8);
    assert.ok(!ids.includes("etrune"));
    assert.deepEqual([...DEFAULT_HIDDEN_PLATFORMS], ["etrune"]);
  });

  it("lists every platform when nothing is hidden", () => {
    assert.equal(platformsForSettings({ hidden: [] }).length, STONEOS_PLATFORMS.length);
  });

  it("hides the platforms the host names", () => {
    const ids = platformsForSettings({ hidden: ["vca", "hivora"] }).map((entry) => entry.id);

    assert.ok(!ids.includes("vca") && !ids.includes("hivora"));
    assert.ok(ids.includes("etrune"));
  });

  it("does not change the catalog", () => {
    platformsForSettings({ hidden: ["veripass"] });

    assert.equal(STONEOS_PLATFORMS.length, 9);
  });
});

describe("platformLabels", () => {
  it("answers in the locale asked for", () => {
    assert.equal(platformLabels(byId("veripass"), "es").capability, "Identidad");
    assert.equal(platformLabels(byId("veripass"), "en").capability, "Identity");
  });

  it("falls back to English for a locale the platform has no copy in", () => {
    assert.equal(platformLabels(byId("veripass"), "pt").capability, "Identity");
    assert.equal(platformLabels(byId("veripass"), undefined).capability, "Identity");
  });
});

describe("platformIconSrc", () => {
  it("joins the host's base path and the icon file", () => {
    assert.equal(platformIconSrc(byId("veripass"), "/assets/images/bsh-apps"), "/assets/images/bsh-apps/veripass.svg");
  });

  it("ignores a trailing slash in the base path", () => {
    assert.equal(platformIconSrc(byId("miretail"), "/icons/"), "/icons/mi-retail.svg");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { STONEOS_PLATFORMS, platformsForSettings } from "../src/components/app-engine/defaults/stoneos-platforms.catalog.js";
import { stoneOSAppsMenuItems } from "../src/features/app-engine/platforms/apps-menu.items.js";

describe("stoneOSAppsMenuItems", () => {
  it("gives AppsMenu its three props", () => {
    const menu = stoneOSAppsMenuItems();

    assert.deepEqual(Object.keys(menu).sort(), ["apps", "header", "more"]);
    assert.deepEqual(Object.keys(menu.header).sort(), ["badgeSrc", "caption", "title"]);
    assert.deepEqual(Object.keys(menu.more).sort(), ["link", "subtitle", "title"]);
  });

  it("lists the platforms of the settings, which leave Êtrune out", () => {
    const { apps } = stoneOSAppsMenuItems();

    assert.deepEqual(
      apps.map((app) => app.id),
      platformsForSettings().map((entry) => entry.id),
    );
    assert.ok(!apps.some((app) => app.id === "etrune"));
  });

  it("makes a tile of each platform: its brand, its portal, its logo and the capability as tagline", () => {
    const veripass = stoneOSAppsMenuItems().apps.find((app) => app.id === "veripass");

    assert.deepEqual(veripass, {
      id: "veripass",
      title: "Veripass",
      link: "https://veripass.com.co",
      icon: "/assets/images/bsh-apps/veripass.svg",
      color: "#E4536A",
      tagline: "Identity",
    });
  });

  it("serves the logos from the base path the host gives", () => {
    const menu = stoneOSAppsMenuItems({ iconBasePath: "/img/" });

    assert.ok(menu.apps.every((app) => app.icon.startsWith("/img/") && !app.icon.includes("//")));
    assert.equal(menu.header.badgeSrc, "/img/stone-os.svg");
  });

  it("carries the StoneOS header and the explore footer", () => {
    const menu = stoneOSAppsMenuItems();

    assert.deepEqual(menu.header, {
      badgeSrc: "/assets/images/bsh-apps/stone-os.svg",
      title: "StoneOS",
      caption: "Blackwood Stone Platforms",
    });
    assert.deepEqual(menu.more, {
      link: "https://stoneos.blackwoodstoneholdings.com",
      title: "Explore StoneOS",
      subtitle: "Every platform in one place",
    });
  });

  it("sends the footer to the store the host names", () => {
    assert.equal(stoneOSAppsMenuItems({ storeLink: "/client/stoneos/store" }).more.link, "/client/stoneos/store");
  });

  it("speaks Spanish when asked to", () => {
    const menu = stoneOSAppsMenuItems({ locale: "es" });

    assert.equal(menu.apps.find((app) => app.id === "veripass").tagline, "Identidad");
    assert.equal(menu.more.title, "Explorar StoneOS");
    assert.equal(menu.header.caption, "Plataformas de Blackwood Stone");
  });

  it("falls back to English for a locale it has no copy in", () => {
    assert.equal(stoneOSAppsMenuItems({ locale: "pt" }).more.title, "Explore StoneOS");
  });

  it("lets the host override part of the copy and keeps the rest", () => {
    const menu = stoneOSAppsMenuItems({ labels: { caption: "Our platforms", more: { title: "All apps" } } });

    assert.equal(menu.header.caption, "Our platforms");
    assert.equal(menu.more.title, "All apps");
    assert.equal(menu.more.subtitle, "Every platform in one place");
  });

  it("lists the platforms the host passes, Êtrune included when it asks", () => {
    const { apps } = stoneOSAppsMenuItems({ platforms: STONEOS_PLATFORMS });

    assert.equal(apps.length, 9);
    assert.equal(apps.at(-1).title, "Êtrune");
  });
});

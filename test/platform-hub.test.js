import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { Description as ContractsIcon, People as UsersIcon } from "@mui/icons-material";

import { STONEOS_PLATFORMS } from "../src/components/app-engine/defaults/stoneos-platforms.catalog.js";
import PlatformHub from "../src/components/app-engine/platforms/PlatformHub.component.jsx";

const veripass = STONEOS_PLATFORMS.find((entry) => entry.id === "veripass");
const SECTIONS = [
  { to: "/client/veripass/user/management", title: "Users", description: "Register and manage people.", Icon: UsersIcon },
  { to: "/client/veripass/legal/contract/management", title: "Contracts", description: "Manage agreements.", Icon: ContractsIcon },
];

const render = (props) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PlatformHub, { platform: veripass, ...props })));

describe("PlatformHub", () => {
  it("prints the capability as the title and the description under it", () => {
    const markup = render({ sections: SECTIONS });

    assert.match(markup, /<h4 class="mb-2 mt-1">Identity<\/h4>/);
    assert.match(markup, /<p class="text-muted mb-3">Identity, trust and contextual access/);
  });

  it("keeps the semantic skeleton of the other hubs", () => {
    const markup = render({ sections: SECTIONS });

    assert.ok(markup.startsWith('<section class="container-fluid my-4 px-4"><section class="row"><header class="col-12">'));
  });

  it("renders a card per section the host gives, in order, linking to its route", () => {
    const markup = render({ sections: SECTIONS });

    assert.ok(markup.indexOf("Users") < markup.indexOf("Contracts"));
    assert.ok(markup.includes('href="/client/veripass/user/management"'));
    assert.ok(markup.includes('href="/client/veripass/legal/contract/management"'));
  });

  it("puts the sections first, then the help center, then the portal", () => {
    const markup = render({ sections: SECTIONS, supportPath: "/client/platforms/veripass/support" });

    assert.ok(markup.indexOf("Contracts") < markup.indexOf("Help center"));
    assert.ok(markup.indexOf("Help center") < markup.indexOf("Go to Veripass"));
  });

  it("links the help center to the support path", () => {
    const markup = render({ sections: SECTIONS, supportPath: "/client/platforms/veripass/support" });

    assert.ok(markup.includes('href="/client/platforms/veripass/support"'));
    assert.match(markup, /Guides, support cases and the assistant for Veripass\./);
  });

  it("has no help center card without a support path", () => {
    assert.ok(!render({ sections: SECTIONS }).includes("Help center"));
  });

  it("links the portal card to the platform's own site", () => {
    const markup = render({ sections: SECTIONS });

    assert.ok(markup.includes('href="https://veripass.com.co"'));
    assert.match(markup, /Go to Veripass/);
  });

  it("says the StoneOS app will open here when the host has no sections, without a link to nowhere", () => {
    const markup = render({ sections: [], supportPath: "/support" });

    assert.match(markup, /Coming soon/);
    assert.match(markup, /Identity will open its StoneOS app here\./);
    assert.match(markup, /<article class="d-flex col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3 mb-3">/, "the coming soon card is not a QuickLinkCard");
    assert.equal((markup.match(/<a /g) || []).length, 2, "only the help center and the portal link");
  });

  it("shows the platform logo on the coming soon card from the host's icon path", () => {
    const markup = render({ iconBasePath: "/img/" });

    assert.ok(markup.includes('src="/img/veripass.svg"'));
  });

  it("does not show the coming soon card once there are sections", () => {
    assert.ok(!render({ sections: SECTIONS }).includes("Coming soon"));
  });

  it("treats a missing sections prop as none, and serves the logo from the ecosystem's usual folder", () => {
    const markup = render({});

    assert.match(markup, /Coming soon/);
    assert.ok(markup.includes('src="/assets/images/bsh-apps/veripass.svg"'));
  });

  it("uses the same card classes for every card", () => {
    const markup = render({ sections: SECTIONS, supportPath: "/support" });

    assert.equal((markup.match(/class="d-flex col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3 mb-3"/g) || []).length, 4);
  });

  it("paints the icon of every card with the platform's color", () => {
    const markup = render({ sections: SECTIONS, supportPath: "/support" });

    assert.equal((markup.match(/data-icon-color="#E4536A"/g) || []).length, 4);
    assert.equal((markup.match(/data-icon-background="0.15"/g) || []).length, 4);
  });

  it("speaks Spanish when asked to", () => {
    const markup = render({ locale: "es", supportPath: "/support" });

    assert.match(markup, /<h4 class="mb-2 mt-1">Identidad<\/h4>/);
    assert.match(markup, /Centro de ayuda/);
    assert.match(markup, /Ir a Veripass/);
    assert.match(markup, /Próximamente/);
  });

  it("lets the host override part of the copy and keeps the rest", () => {
    const markup = render({ supportPath: "/support", labels: { helpCenter: { title: "Support" } } });

    assert.match(markup, /Support/);
    assert.ok(!markup.includes("Help center"));
    assert.match(markup, /Go to Veripass/);
  });

  it("renders nothing without a platform", () => {
    assert.equal(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PlatformHub, { platform: null }))), "");
  });
});

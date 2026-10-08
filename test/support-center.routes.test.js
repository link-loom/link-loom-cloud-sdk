import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  createRoutesFromElements,
  matchRoutes,
  useResolvedPath,
} from "react-router-dom";
import { Description as ContractsIcon } from "@mui/icons-material";

import { STONEOS_PLATFORMS } from "../src/components/app-engine/defaults/stoneos-platforms.catalog.js";
import SupportCenterLayout from "../src/components/support/center/SupportCenterLayout.component.jsx";
import supportCenterRoutes from "../src/features/support/center/support-center.routes.jsx";
import stoneOSPlatformRoutes from "../src/features/app-engine/platforms/stoneos-platform.routes.jsx";

const CENTER = {
  namespaceSlug: "veripass",
  productSlug: "veripass",
  productDisplayName: "Veripass",
  originSurface: "miretail-workspace-webapp",
};

const supportRoutes = (options = CENTER) => createRoutesFromElements(createElement(Route, { path: "veripass/support" }, supportCenterRoutes(options)));
const matchPath = (routes, pathname) => matchRoutes(routes, pathname)?.at(-1);

describe("supportCenterRoutes", () => {
  it("is a layout route without a path, so the host decides where it is mounted", () => {
    const element = supportCenterRoutes(CENTER);

    assert.equal(element.type, Route);
    assert.equal(element.props.path, undefined);
    assert.equal(element.props.element.type, SupportCenterLayout);
  });

  it("gives the layout what the host told it", () => {
    const assistant = { executionService: {}, llmProviderService: {}, components: {} };
    const renderBridge = () => null;
    const { props } = supportCenterRoutes({ ...CENTER, assistant, renderBridge, labels: { loading: "…" }, locale: "es" }).props.element;

    assert.equal(props.namespaceSlug, "veripass");
    assert.equal(props.productSlug, "veripass");
    assert.equal(props.productDisplayName, "Veripass");
    assert.equal(props.originSurface, "miretail-workspace-webapp");
    assert.equal(props.assistant, assistant);
    assert.equal(props.renderBridge, renderBridge);
    assert.deepEqual(props.labels, { loading: "…" });
    assert.equal(props.locale, "es");
  });

  it("has no assistant unless the host gives one", () => {
    assert.equal(supportCenterRoutes(CENTER).props.element.props.assistant, null);
  });

  it("answers on the paths of the other help centers, relative to the mount", () => {
    const [mount] = supportRoutes();
    const [layout] = mount.children;

    assert.equal(mount.path, "veripass/support");
    assert.equal(layout.path, undefined);
    assert.deepEqual(
      layout.children.map((route) => (route.index ? "(index)" : route.path)),
      ["(index)", "hub", "cases", "new-case", "case/:id", "assistant", "incidents", "guide/:slug", "categories"],
    );
  });

  it("sends the index to the hub and incidents to the case list", () => {
    const [index, , , , , , incidents] = supportRoutes()[0].children[0].children;

    assert.equal(index.element.type, Navigate);
    assert.equal(index.element.props.to, "hub");
    assert.equal(incidents.element.type, Navigate);
    assert.equal(incidents.element.props.to, "../cases");
    assert.ok(index.element.props.replace && incidents.element.props.replace);
  });

  it("matches the pages of the center with their parameters", () => {
    const routes = supportRoutes();

    assert.equal(matchPath(routes, "/veripass/support/hub").route.path, "hub");
    assert.deepEqual(matchPath(routes, "/veripass/support/case/abc-1").params, { id: "abc-1" });
    assert.deepEqual(matchPath(routes, "/veripass/support/guide/reset-password").params, { slug: "reset-password" });
    assert.equal(matchPath(routes, "/veripass/support/new-case").route.path, "new-case");
    assert.equal(matchPath(routes, "/veripass/support").route.index, true);
    assert.equal(matchRoutes(routes, "/veripass/support/nowhere"), null);
  });

  it("shares one layout between every page", () => {
    const routes = supportRoutes();

    for (const pathname of ["/veripass/support/hub", "/veripass/support/cases", "/veripass/support/assistant"]) {
      assert.equal(matchRoutes(routes, pathname)[1].route.element.type, SupportCenterLayout);
    }
  });

  it("works out its base path from the route it is mounted on", () => {
    const Probe = () => createElement("span", { "data-base": useResolvedPath("").pathname });
    const probeTree = createElement(
      Routes,
      null,
      createElement(
        Route,
        { path: "/client/platforms/:platformId/support" },
        createElement(Route, { element: createElement(Probe) }, createElement(Route, { path: "hub", element: null })),
      ),
    );

    const markup = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/client/platforms/vca/support/hub"] }, probeTree));

    assert.equal(markup, '<span data-base="/client/platforms/vca/support"></span>');
  });
});

describe("stoneOSPlatformRoutes", () => {
  const platformRoutes = (options) =>
    createRoutesFromElements(createElement(Route, { path: "/client" }, stoneOSPlatformRoutes(options)));

  it("mounts the hub and the help center of a platform under platforms", () => {
    const [client] = platformRoutes();
    const [platforms] = client.children;

    assert.equal(platforms.path, "platforms");
    assert.deepEqual(
      platforms.children.map((route) => route.path),
      [":platformId", ":platformId/support"],
    );
  });

  it("gives the help center the same pages as supportCenterRoutes", () => {
    const [support] = platformRoutes()[0].children[0].children.slice(1);

    assert.deepEqual(
      support.children.map((route) => (route.index ? "(index)" : route.path)),
      ["(index)", "hub", "cases", "new-case", "case/:id", "assistant", "incidents", "guide/:slug", "categories"],
    );
  });

  it("matches a platform's hub and its help center pages", () => {
    const routes = platformRoutes();

    assert.deepEqual(matchPath(routes, "/client/platforms/veripass").params, { platformId: "veripass" });
    assert.deepEqual(matchPath(routes, "/client/platforms/vca/support/hub").params, { platformId: "vca" });
    assert.deepEqual(matchPath(routes, "/client/platforms/miretail/support/case/9").params, { platformId: "miretail", id: "9" });
    assert.equal(matchPath(routes, "/client/platforms").params.platformId, undefined);
  });

  const renderAt = (pathname, options) =>
    renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        createElement(Routes, null, createElement(Route, { path: "/client" }, stoneOSPlatformRoutes(options))),
      ),
    );

  it("renders the hub of the platform in the url, linking its help center under the current route", () => {
    const markup = renderAt("/client/platforms/veripass", { locale: "en" });

    assert.match(markup, /<h4 class="mb-2 mt-1">Identity<\/h4>/);
    assert.ok(markup.includes('href="/client/platforms/veripass/support"'));
    assert.ok(markup.includes('href="https://veripass.com.co"'));
    assert.match(markup, /Coming soon/);
  });

  it("asks the host for the sections of the platform", () => {
    const asked = [];
    const sectionsFor = (platform) => {
      asked.push(platform.id);
      return [{ to: "/client/veripass/contracts", title: "Contracts", description: "Agreements.", Icon: ContractsIcon }];
    };

    const markup = renderAt("/client/platforms/veripass", { sectionsFor });

    assert.deepEqual(asked, ["veripass"]);
    assert.ok(markup.includes('href="/client/veripass/contracts"'));
    assert.ok(!markup.includes("Coming soon"));
  });

  it("speaks the locale and serves the logos from the base path the host gives", () => {
    const markup = renderAt("/client/platforms/hivora", { locale: "es", iconBasePath: "/img" });

    assert.match(markup, /<h4 class="mb-2 mt-1">Dispositivos<\/h4>/);
    assert.match(markup, /Centro de ayuda/);
    assert.ok(markup.includes('src="/img/hivora.svg"'));
  });

  it("renders nothing for a platform it does not list", () => {
    assert.equal(renderAt("/client/platforms/unknown"), "");
  });

  it("does not list Êtrune unless the host passes it", () => {
    assert.equal(renderAt("/client/platforms/etrune"), "");
    assert.match(renderAt("/client/platforms/etrune", { platforms: STONEOS_PLATFORMS }), /Retail/);
  });
});

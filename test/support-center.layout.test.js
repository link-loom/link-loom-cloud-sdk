import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import SupportCenterLayout from "../src/components/support/center/SupportCenterLayout.component.jsx";

const CENTER = {
  namespaceSlug: "veripass",
  productSlug: "veripass",
  productDisplayName: "Veripass",
  originSurface: "test",
  baseUrl: "https://llc.test",
};

// A server render runs no effect, so the center is on its first screen: nothing loaded, loading text up.
const render = (props) =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ["/client/veripass/support/hub"] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { path: "/client/veripass/support" },
          createElement(
            Route,
            { element: createElement(SupportCenterLayout, { ...CENTER, ...props }) },
            createElement(Route, { path: "hub", element: null }),
          ),
        ),
      ),
    ),
  );

describe("SupportCenterLayout", () => {
  before(() => {
    globalThis.window = { location: { pathname: "/client/veripass/support/hub" } };
  });

  after(() => {
    delete globalThis.window;
  });

  it("shows the loading copy while the center loads", () => {
    assert.match(render({}), /Loading support\.\.\./);
  });

  it("loads in Spanish when asked to", () => {
    assert.match(render({ locale: "es" }), /Cargando soporte\.\.\./);
  });

  it("falls back to English for a locale it has no copy in", () => {
    assert.match(render({ locale: "pt" }), /Loading support\.\.\./);
  });

  it("lets the host override the copy", () => {
    assert.match(render({ labels: { loading: "One moment" } }), /One moment/);
  });

  it("starts without an assistant", () => {
    assert.doesNotThrow(() => render({ assistant: null }));
  });

  it("does not capture console output when it only renders", () => {
    const { error } = console;

    render({});

    assert.equal(console.error, error);
  });
});

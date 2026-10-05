import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  APP_SEARCH_CATEGORY_ID,
  AppSearchHit,
  createAppSearchCategory,
} from "../src/features/app-engine/search/app-search.category.jsx";

const HIT = {
  app_slug: "stoneos-accounting",
  app_name: "Accounting",
  entity_type: "invoice",
  entity_label: "Invoice",
  entity_labels: { en: "Invoice", es: "Factura" },
  id: "inv-1",
  title: "FV-981 · Acme <Corp>",
  subtitle: "Pagada el 3 de octubre",
  status: { name: "paid", title: "Paid" },
  deep_link: "/invoices?id=inv-1",
};

const createCategory = (options = {}) => {
  const requests = [];
  const client = {
    searchRecords: async (request) => {
      requests.push(request);
      return { items: [HIT], totalItems: 1, sources: [] };
    },
  };

  return { requests, category: createAppSearchCategory({ client, locale: "es", limit: 7, ...options }) };
};

describe("app search category for Omnisearch", () => {
  it("is a category the overlay lists as it comes: matched by the server, keyed by app, entity and id", () => {
    const { category } = createCategory({ labels: { category: "En tus apps" } });

    assert.equal(category.id, APP_SEARCH_CATEGORY_ID);
    assert.equal(category.label, "En tus apps");
    assert.equal(category.serverFiltered, true);
    assert.equal(category.itemKey(HIT), "stoneos-accounting:invoice:inv-1");
    assert.equal(category.itemValue(HIT), "stoneos-accounting:invoice:inv-1");
    assert.equal(typeof category.renderItem, "function");
  });

  it("searches with the text the overlay passes and answers the items", async () => {
    const { category, requests } = createCategory();

    const items = await category.search({ query: "acme" });

    assert.deepEqual(items, [HIT]);
    assert.deepEqual(requests, [{ text: "acme", limit: 7 }]);
  });

  it("opens a result in its app, at its record", () => {
    const { category } = createCategory();
    const navigated = [];
    const opened = [];
    const withOpen = createCategory({ onOpen: (hit, path) => opened.push([hit.id, path]) }).category;

    category.onSelect(HIT, (path) => navigated.push(path));
    withOpen.onSelect(HIT, () => {});

    assert.deepEqual(navigated, ["/client/app-engine/runtime/stoneos-accounting/invoices?id=inv-1"]);
    assert.deepEqual(opened, [["inv-1", "/client/app-engine/runtime/stoneos-accounting/invoices?id=inv-1"]]);
  });

  it("opens through the base path the host declares", () => {
    const { category } = createCategory({ basePath: "/apps" });
    const navigated = [];

    category.onSelect(HIT, (path) => navigated.push(path));

    assert.deepEqual(navigated, ["/apps/stoneos-accounting/invoices?id=inv-1"]);
  });

  it("opens nothing for a result that is not a path inside an app", () => {
    const { category } = createCategory();
    const navigated = [];

    for (const hit of [{ ...HIT, deep_link: "https://evil.example" }, { ...HIT, deep_link: "//evil.example" }, { ...HIT, app_slug: "" }]) {
      category.onSelect(hit, (path) => navigated.push(path));
    }

    assert.deepEqual(navigated, []);
  });

  it("shows the title, the line of context and which app and kind of record it is", () => {
    const markup = renderToStaticMarkup(createElement(AppSearchHit, { hit: HIT, locale: "es" }));

    assert.match(markup, /FV-981 · Acme &lt;Corp&gt;/);
    assert.match(markup, /Pagada el 3 de octubre/);
    assert.match(markup, /Accounting · Factura · Paid/);
    assert.doesNotMatch(markup, /<Corp>/);
  });

  it("draws the logo of the app that holds the result, from the backend the search asked", () => {
    const markup = renderToStaticMarkup(
      createElement(AppSearchHit, { hit: HIT, locale: "en", baseUrl: "https://llc.test" }),
    );

    assert.match(markup, /<img src="https:\/\/llc\.test\/app-engine\/definition\/icon\/stoneos-accounting"/);
  });

  it("leaves out the line of context a result does not have", () => {
    const markup = renderToStaticMarkup(createElement(AppSearchHit, { hit: { ...HIT, subtitle: "" }, locale: "en" }));

    assert.doesNotMatch(markup, /Pagada/);
    assert.match(markup, /Accounting · Invoice · Paid/);
  });
});

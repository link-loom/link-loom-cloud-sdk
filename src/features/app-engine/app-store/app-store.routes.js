/**
 * The App Store's own routes, relative to where the host mounts it (`paths.store`, mounted as
 * `store/*`). Every screen is a URL — an app's page, a suite, a category — so a link can be shared
 * and the back button behaves; filters and the search live in the query string.
 */
export const STORE_VIEWS = {
  discover: "discover",
  search: "search",
  suites: "suites",
  suite: "suite",
  app: "app",
  category: "category",
  organization: "organization",
};

export const STORE_SEGMENTS = {
  suites: "suites",
  apps: "apps",
  categories: "categories",
  organization: "organization",
};

export const STORE_QUERY = {
  search: "q",
  category: "category",
  suite: "suite",
};

const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

export const buildStorePaths = (base) => {
  const root = trimSlash(base);

  return {
    discover: () => root,
    search: (term) => (term ? `${root}?${STORE_QUERY.search}=${encodeURIComponent(term)}` : root),
    suites: () => `${root}/${STORE_SEGMENTS.suites}`,
    suite: (slug) => `${root}/${STORE_SEGMENTS.suites}/${encodeURIComponent(slug)}`,
    app: (slug) => `${root}/${STORE_SEGMENTS.apps}/${encodeURIComponent(slug)}`,
    category: (category) => `${root}/${STORE_SEGMENTS.categories}/${encodeURIComponent(category)}`,
    organization: () => `${root}/${STORE_SEGMENTS.organization}`,
  };
};

/** Which screen a location shows, and its slug or category, for the sidebar and the bridge. */
export const resolveStoreLocation = (pathname, search, base) => {
  const root = trimSlash(base);
  const rest = String(pathname || "").startsWith(root) ? pathname.slice(root.length) : pathname;
  const [segment, value] = rest.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  const query = new URLSearchParams(search || "").get(STORE_QUERY.search) || "";

  if (segment === STORE_SEGMENTS.suites && value) return { view: STORE_VIEWS.suite, suite: value, query };
  if (segment === STORE_SEGMENTS.suites) return { view: STORE_VIEWS.suites, query };
  if (segment === STORE_SEGMENTS.apps && value) return { view: STORE_VIEWS.app, app: value, query };
  if (segment === STORE_SEGMENTS.categories && value) return { view: STORE_VIEWS.category, category: value, query };
  if (segment === STORE_SEGMENTS.organization) return { view: STORE_VIEWS.organization, query };
  if (query) return { view: STORE_VIEWS.search, query };

  return { view: STORE_VIEWS.discover, query };
};

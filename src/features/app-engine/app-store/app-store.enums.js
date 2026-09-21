/**
 * The closed values of the App Store, mirrored from the Link Loom Cloud catalogs
 * (`GET /app-engine/store/catalogs`, `GET /app-engine/suite/catalogs`). Each map is `backend key → the
 * wire name` the API persists, filters by and returns inside `{ id, name, title, color }`.
 *
 * The UI never writes one of these values as a literal: it reads them from here, and every title a
 * person sees comes from `storeLabels`, indexed by the same backend key. Categories are extensible in
 * the backend; a category missing here still renders, with the catalog's own title and the default
 * glyph, because the category lists on screen come from `catalogs`, not from this file.
 */
export const STORE_CATEGORIES = {
  ai: "ai",
  productivity: "productivity",
  operations: "operations",
  sales: "sales",
  finance: "finance",
  communication: "communication",
  analytics: "analytics",
  support: "support",
  people: "people",
};

export const STORE_SCOPES = {
  all: "all",
  organization: "organization",
};

export const STORE_SORTS = {
  featured: "featured",
  name: "name",
  recent: "recent",
};

export const STORE_ACCESS_STATES = {
  owned: "owned",
  entitled: "entitled",
  available: "available",
};

export const STORE_PRICING_MODELS = {
  free: "free",
  oneTime: "one_time",
};

export const STORE_MEDIA_TYPES = {
  image: "image",
  video: "video",
};

export const STORE_VISIBILITIES = {
  private: "private",
  public: "public",
};

export const SUITE_KINDS = {
  core: "core",
  business: "business",
  industry: "industry",
};

// The wire name of a catalog value, whether it arrives as the persisted object or as its name.
export const enumName = (value) => (value && typeof value === "object" ? value.name : value) || null;

// The backend key of a value (`one_time` → `oneTime`), for indexing labels.
export const enumKeyOf = (enumMap, value) => {
  const name = enumName(value);

  if (!name) {
    return null;
  }

  return Object.keys(enumMap).find((key) => enumMap[key] === name) || null;
};

export const isEnumValue = (value, name) => enumName(value) === name;

// The entries of a catalog from the backend, as a list in its declared order (`id`).
export const catalogEntries = (catalog) =>
  Object.entries(catalog || {})
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((left, right) => (Number(left.id) || 0) - (Number(right.id) || 0));

// The kinds of an app's typed contracts (`app_definition.contracts[].kind`).
export const APP_CONTRACT_KINDS = {
  input: "input",
  output: "output",
  event: "event",
};

// The `error_code` of App Engine refusals the UI branches on (backend `app-engine-status-codes.js`).
export const APP_ENGINE_ERROR_CODES = {
  appNotEntitled: "app_not_entitled",
  appNotFound: "app_not_found",
  suiteNotFound: "suite_not_found",
  organizationRequired: "organization_required",
};

// The store's pills (`AppStorePillComponent`), by what they do: `accent` buys or gets a suite, `tint`
// gets a free app, `dark` opens an app or starts building, `neutral` looks or goes somewhere, `danger`
// deletes. UI values only; nothing on the wire.
export const STORE_PILL_TONES = {
  accent: "accent",
  tint: "tint",
  dark: "dark",
  neutral: "neutral",
  danger: "danger",
};

// `small` on cards and rows, `medium` in banners and dialogs, `large` as the one action of a page.
export const STORE_PILL_SIZES = {
  small: "small",
  medium: "medium",
  large: "large",
};

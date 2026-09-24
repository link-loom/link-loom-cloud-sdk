// `sdk.backend`: the app's own namespace in the Link Loom Cloud backend (`/apps/<app-slug>/v1`), over the
// authenticated `sdk.loom` client. Every request carries the identity headers the namespace's
// `app-session` routes expect (Authorization, x-veripass-organization-identity, x-loom-app-session),
// resolves the envelope `result` and rejects with `RuntimeHttpError`, exactly like `sdk.loom`:
//   const entries = await sdk.backend.get('/journal-entry/by-period', { period });
// Only apps whose definition declares `backend: { namespace: '<app-slug>' }` get it.

export const APP_BACKEND_API_VERSION = "v1";

const NAMESPACE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// URL parsers resolve these segments (also percent-encoded), which would leave the namespace prefix.
const DOT_SEGMENT_PATTERN = /^(?:\.|%2e){1,2}$/i;

export const isValidBackendNamespace = (value) => typeof value === "string" && NAMESPACE_PATTERN.test(value);

export const buildAppBackendPrefix = (namespace) => `/apps/${namespace}/${APP_BACKEND_API_VERSION}`;

// The namespace an app definition declares, or null. A namespace serves only its own app (the
// `app-session` handler refuses a session of another app), so one that is not the app's slug is ignored.
export const resolveBackendNamespace = ({ appDefinition, appSlug } = {}) => {
  const namespace = appDefinition?.backend?.namespace;
  if (!isValidBackendNamespace(namespace)) {
    return null;
  }

  const ownSlug = appSlug || appDefinition?.slug;
  if (namespace !== ownSlug) {
    return null;
  }

  return namespace;
};

const toNamespacePath = (path) => {
  if (typeof path !== "string" || !path) {
    throw new TypeError("sdk.backend needs a path inside the app namespace, e.g. '/record/all'");
  }

  const relativePath = path.startsWith("/") ? path : `/${path}`;
  const [pathname] = relativePath.split(/[?#]/, 1);
  const leavesNamespace = pathname.includes("\\") || pathname.split("/").some((segment) => DOT_SEGMENT_PATTERN.test(segment));

  if (leavesNamespace) {
    throw new TypeError(`sdk.backend paths stay inside the app namespace: ${path}`);
  }

  return relativePath;
};

const isPlainObject = (value) => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isNestedQueryValue = (value) => isPlainObject(value) || (Array.isArray(value) && value.some(isPlainObject));

// Each query key becomes one URL parameter, so a nested object would reach the backend as "[object Object]"
// (the axios form `{ params: { period } }` is the usual slip). It is refused before any request.
const toNamespaceQuery = (query) => {
  if (query === undefined || query === null) {
    return query;
  }

  if (!isPlainObject(query)) {
    throw new TypeError("sdk.backend.get takes its query as a plain object, e.g. sdk.backend.get('/journal-entry/by-period', { period })");
  }

  const nestedKey = Object.keys(query).find((key) => isNestedQueryValue(query[key]));
  if (nestedKey !== undefined) {
    throw new TypeError(
      `sdk.backend.get sends each query key as one URL parameter and "${nestedKey}" holds an object; pass the values flat, e.g. sdk.backend.get('/journal-entry/by-period', { period })`,
    );
  }

  return query;
};

export const createAppBackendClient = ({ loom, namespace }) => {
  if (!loom) {
    throw new Error("createAppBackendClient needs the authenticated sdk.loom client");
  }

  if (!isValidBackendNamespace(namespace)) {
    throw new Error(`createAppBackendClient needs a namespace slug, got: ${namespace}`);
  }

  const prefix = buildAppBackendPrefix(namespace);
  const resolve = (path) => `${prefix}${toNamespacePath(path)}`;

  return Object.freeze({
    namespace,
    prefix,
    baseUrl: `${loom.baseUrl || ""}${prefix}`,
    headers: () => loom.headers(),
    get: async (path, query, options) => loom.get(resolve(path), toNamespaceQuery(query), options),
    post: async (path, body, options) => loom.post(resolve(path), body, options),
    patch: async (path, body, options) => loom.patch(resolve(path), body, options),
    delete: async (path, body, options) => loom.delete(resolve(path), body, options),
  });
};

// What a runtime host puts in `sdk.backend`: the client when the app definition declares the app's
// namespace, null otherwise (the host then leaves `sdk.backend` out).
export const createAppBackend = ({ loom, appDefinition, appSlug }) => {
  const namespace = resolveBackendNamespace({ appDefinition, appSlug });
  if (!namespace || !loom) {
    return null;
  }

  return createAppBackendClient({ loom, namespace });
};

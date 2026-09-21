import { buildIdentityHeaders, readIdentitySession } from "../identity/identity-session";

// `sdk.loom`: requests to the Link Loom Cloud backend (`sdk.context.loomCloudBaseUrl`) carrying the
// identity headers of the app session (Authorization, organization, app session). Resolves the
// envelope `result` and rejects with `RuntimeHttpError` (or the AbortError of `signal`).
export const createLoomClient = (http) => ({
  baseUrl: http.baseUrl,
  headers: () => http.headers(),
  get: (path, params, { signal } = {}) => http.request({ path, query: params, signal }),
  post: (path, body, { signal } = {}) => http.request({ method: "POST", path, body: body ?? {}, signal }),
  patch: (path, body, { signal } = {}) => http.request({ method: "PATCH", path, body: body ?? {}, signal }),
  delete: (path, body, { signal } = {}) => http.request({ method: "DELETE", path, body, signal }),
});

// Identity headers of an app runtime `sdk`, for clients that take a `getHeaders` callback, e.g.
// `new StorageObjectService({ baseUrl: sdk.context.loomCloudBaseUrl, getHeaders: () => createLoomIdentityHeaders(sdk) })`.
// Read them per request: the app session id changes when an offline session is reopened.
export const createLoomIdentityHeaders = (sdk) => sdk?.loom?.headers?.() || {};

// Identity headers of the host's own signed-in session — the Veripass session `useAuth().getToken()`
// returns — for host surfaces that call Link Loom Cloud as the person, outside any app runtime (the
// App Store, the launchpad catalog, the Command Center catalog). Same Authorization and organization
// headers an app runtime sends, without an app session. Read them per request, e.g.
// `new AppEngineStoreService({ baseUrl, getHeaders: () => createSessionIdentityHeaders(getToken()) })`.
export const createSessionIdentityHeaders = (session) => buildIdentityHeaders(readIdentitySession(session));

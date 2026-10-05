import RuntimeHttpClient from "../runtime/shared/runtime-http.client";
import { createSessionIdentityHeaders } from "../runtime/shared/loom-identity.client";

const SEARCH_PATH = "/app-engine/app-search";

export const APP_SEARCH_MIN_LENGTH = 2;
export const APP_SEARCH_MAX_LENGTH = 80;

const EMPTY_SEARCH = { items: [], totalItems: 0, sources: [] };

/**
 * Search across the apps of the signed-in person's organization (`GET /app-engine/app-search/…`):
 * the records every app declares searchable, best match first, each with `deep_link`, the path
 * inside its app that opens it. It acts as the person (Veripass token and organization), with no app
 * session, so it serves host surfaces: Omnisearch and the Launchpad. The organization is the
 * principal's, never a parameter.
 */
export default class AppSearchClient {
  constructor({ http }) {
    this._http = http;
  }

  /** Text shorter than the backend accepts is not asked: there is nothing to find yet. */
  async searchRecords({ text, apps, limit, perAppLimit, signal } = {}) {
    const search = String(text || "").trim();

    if (search.length < APP_SEARCH_MIN_LENGTH) {
      return EMPTY_SEARCH;
    }

    const result = await this._http.request({
      path: `${SEARCH_PATH}/records`,
      query: { search: search.slice(0, APP_SEARCH_MAX_LENGTH), apps, limit, per_app_limit: perAppLimit },
      signal,
    });

    return {
      items: Array.isArray(result?.items) ? result.items : [],
      totalItems: result?.totalItems ?? 0,
      sources: Array.isArray(result?.sources) ? result.sources : [],
    };
  }

  /** The apps of the organization that declare searchable entities, each with its entities. */
  async listSources({ signal } = {}) {
    const result = await this._http.request({ path: `${SEARCH_PATH}/sources`, signal });

    return Array.isArray(result?.items) ? result.items : [];
  }
}

/**
 * The client of a host surface: Link Loom Cloud at `baseUrl`, as the person of `getSession()` (the
 * Veripass session `useAuth().getToken()` returns, read on every request so a refreshed session or a
 * switched organization is used at once).
 */
export const createAppSearchClient = ({ baseUrl, getSession, fetchImpl }) =>
  new AppSearchClient({
    http: new RuntimeHttpClient({
      baseUrl,
      fetchImpl,
      getHeaders: () => createSessionIdentityHeaders(getSession?.()),
    }),
  });

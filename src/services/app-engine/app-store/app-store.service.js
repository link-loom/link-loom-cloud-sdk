import IdentityApi from "../../base/identity-api.service";

/**
 * The App Store read model of Link Loom Cloud (`GET /app-engine/store/:queryselector`), read as the
 * signed-in person: the organization is the principal's, so every answer says what that organization
 * already has (`access`) and can add.
 *
 * - `apps`: the paginated catalog (`page`, default `pageSize`) filtered by `search`, `category`, `suite`,
 *   `scope` and `sort` — values from `catalogs`.
 * - `facets`: counts for the navigation (categories, suites, the organization's own apps) and the
 *   organization's name.
 * - `home`: the Discover page — the Featured banner (`spotlight`, or null), every featured app
 *   (`suggested`) and the highlighted `suites`.
 * - `app`: one app's page by slug.
 * - `catalogs`: the closed values (categories, scopes, sorts, access states, pricing models, media
 *   types, suite kinds).
 */
export default class AppEngineStoreService extends IdentityApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/store/",
    };
  }

  async getApps(params = {}) {
    return this.getByParameters({ queryselector: "apps", ...params });
  }

  async getFacets() {
    return this.getByParameters({ queryselector: "facets" });
  }

  async getHome() {
    return this.getByParameters({ queryselector: "home" });
  }

  async getApp({ slug }) {
    return this.getByParameters({ queryselector: "app", search: slug });
  }

  async getCatalogs() {
    return this.getByParameters({ queryselector: "catalogs" });
  }
}

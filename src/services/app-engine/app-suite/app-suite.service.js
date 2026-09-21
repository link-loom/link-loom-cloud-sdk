import IdentityApi from "../../base/identity-api.service";

/**
 * Business suites (`GET /app-engine/suite/:queryselector`), read as the signed-in person: each suite
 * carries the organization's coverage (`apps_total`, `apps_in_use`, `coverage_pct`). Suites are managed
 * in the Link Loom Cloud admin; this client only reads them.
 */
export default class AppEngineAppSuiteService extends IdentityApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/suite/",
    };
  }

  async getAll(params = {}) {
    return this.getByParameters({ queryselector: "all", ...params });
  }

  async getHighlighted(params = {}) {
    return this.getByParameters({ queryselector: "highlighted", ...params });
  }

  async getBySlug({ slug }) {
    return this.getByParameters({ queryselector: "slug", search: slug });
  }

  async getCatalogs() {
    return this.getByParameters({ queryselector: "catalogs" });
  }
}

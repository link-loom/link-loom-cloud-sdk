import IdentityApi from "../../base/identity-api.service";

/**
 * What an organization may open (`/app-engine/entitlement`). `grant` and `grantSuite` give the
 * signed-in person's organization a public app, or every public app of a suite it does not have yet;
 * the organization comes from the principal, never from the body. They grant access only — no
 * payment is taken here.
 */
export default class AppEngineAppEntitlementService extends IdentityApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/entitlement/",
      grant: "/app-engine/entitlement/grant/",
      grantSuite: "/app-engine/entitlement/grant-suite/",
    };
  }

  async grant({ appSlug }) {
    return this.post({ app_slug: appSlug }, { endpoint: this.serviceEndpoints.grant });
  }

  async grantSuite({ suiteSlug }) {
    return this.post({ suite_slug: suiteSlug }, { endpoint: this.serviceEndpoints.grantSuite });
  }

  async getCatalogs() {
    return this.getByParameters({ queryselector: "catalogs" });
  }
}

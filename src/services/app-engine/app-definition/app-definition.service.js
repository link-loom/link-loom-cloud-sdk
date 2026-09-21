import BaseApi from "../../base/api.service";

export default class AppEngineAppDefinitionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    // The catalog reads (`marketplace`, `command-center-catalog`) answer with what the caller's
    // organization can use, so hosts pass the signed-in person's identity headers here.
    this._getHeaders = args?.getHeaders;
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/definition/",
      create: "/app-engine/definition",
      update: "/app-engine/definition",
      delete: "/app-engine/definition",
      createWithScaffold: "/app-engine/definition/scaffold/",
      studioPayload: "/app-engine/definition/studio/",
      marketplace: "/app-engine/definition/marketplace/",
      commandCenterCatalog: "/app-engine/definition/command-center-catalog/",
      fullApp: "/app-engine/definition/full/",
    };
  }

  request(settings = null) {
    const injected = typeof this._getHeaders === "function" ? this._getHeaders() || {} : {};

    return super.request({ ...settings, headers: { ...injected, ...(settings?.headers || {}) } });
  }

  async createWithScaffold(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.createWithScaffold,
    });
  }

  async getStudioPayload(payload) {
    return super.getByParameters({ queryselector: 'studio', ...payload });
  }

  async getMarketplace(payload) {
    return super.get(payload, { endpoint: this.serviceEndpoints.marketplace });
  }

  /**
   * One page of the Command Center catalog: the apps the caller's organization can use that open in
   * the Command Center. Unlike the other reads, a failure resolves to an envelope with the HTTP
   * `status` (0 when the backend was not reached), so a caller can retry only what is transient.
   */
  async getCommandCenterCatalog(payload = {}, settings = {}) {
    try {
      const endpoint = this.urlBuilder({ endpoint: this.serviceEndpoints.commandCenterCatalog });
      const response = await this.request(settings).get(`${endpoint}${this.objectToQueryString(payload)}`);

      return response.data;
    } catch (error) {
      const envelope = error?.response?.data && typeof error.response.data === "object" ? error.response.data : {};

      return { ...envelope, success: false, status: error?.response?.status || 0, message: envelope.message || error?.message || "" };
    }
  }

  async getFullApp(payload) {
    return super.get(payload, { endpoint: this.serviceEndpoints.fullApp });
  }
}

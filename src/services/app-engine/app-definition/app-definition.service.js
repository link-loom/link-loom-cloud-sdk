import BaseApi from "../../base/api.service";

export default class AppEngineAppDefinitionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
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
      fullApp: "/app-engine/definition/full/",
    };
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

  async getFullApp(payload) {
    return super.get(payload, { endpoint: this.serviceEndpoints.fullApp });
  }
}

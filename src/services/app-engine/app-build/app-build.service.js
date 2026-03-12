import BaseApi from "../../base/api.service";

export default class AppEngineAppBuildService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      buildSingle: "/app-engine/build/single",
      buildAll: "/app-engine/build/all",
      buildAndPublish: "/app-engine/build/publish",
    };
  }

  async buildSingle(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildSingle,
      timeout: 180000,
    });
  }

  async buildAll(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildAll,
      timeout: 180000,
    });
  }

  async buildAndPublish(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildAndPublish,
      timeout: 180000,
    });
  }
}

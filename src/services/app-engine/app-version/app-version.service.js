import BaseApi from "../../base/api.service";

export default class AppEngineAppVersionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/version/",
      create: "/app-engine/version",
      update: "/app-engine/version",
      delete: "/app-engine/version",
      publish: "/app-engine/version/publish",
      activate: "/app-engine/version/activate",
    };
  }

  async publish(payload) {
    return super.post(payload, { endpoint: this.serviceEndpoints.publish });
  }

  async activate(payload) {
    return super.patch(payload, { endpoint: this.serviceEndpoints.activate });
  }
}

import BaseApi from "../../base/api.service";

export default class AppEngineAppPreferenceService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/preference/",
      create: "/app-engine/preference",
      update: "/app-engine/preference",
      delete: "/app-engine/preference",
    };
  }
}

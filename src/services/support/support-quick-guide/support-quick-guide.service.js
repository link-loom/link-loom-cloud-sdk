import BaseApi from "../../base/api.service";

export default class SupportQuickGuideService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/support/quick-guide/",
      create: "/support/quick-guide",
      update: "/support/quick-guide",
      delete: "/support/quick-guide",
    };
  }
}

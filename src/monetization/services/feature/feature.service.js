import BaseApi from "../../../services/base/api.service";

export default class MonetizationFeatureService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/feature/",
      create: "/monetization/feature/",
      update: "/monetization/feature/",
      delete: "/monetization/feature/",
    };
  }
}

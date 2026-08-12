import BaseApi from "../../../services/base/api.service";

export default class MonetizationUsageCounterService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/usage-counter/",
      create: "/monetization/usage-counter/",
      update: "/monetization/usage-counter/",
      delete: "/monetization/usage-counter/",
    };
  }
}

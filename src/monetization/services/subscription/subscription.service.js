import BaseApi from "../../../services/base/api.service";

export default class MonetizationSubscriptionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/subscription/",
      create: "/monetization/subscription/",
      update: "/monetization/subscription/",
      delete: "/monetization/subscription/",
    };
  }
}

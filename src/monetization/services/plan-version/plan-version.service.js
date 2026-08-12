import BaseApi from "../../../services/base/api.service";

export default class MonetizationPlanVersionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/plan-version/",
      create: "/monetization/plan-version/",
      update: "/monetization/plan-version/",
      delete: "/monetization/plan-version/",
    };
  }
}

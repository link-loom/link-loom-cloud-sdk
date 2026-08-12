import BaseApi from "../../../services/base/api.service";

export default class MonetizationPlanCatalogService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/plan-catalog/",
      create: "/monetization/plan-catalog/",
      update: "/monetization/plan-catalog/",
      delete: "/monetization/plan-catalog/",
    };
  }
}

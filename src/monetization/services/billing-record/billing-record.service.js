import BaseApi from "../../../services/base/api.service";

export default class MonetizationBillingRecordService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/billing-record/",
      create: "/monetization/billing-record/",
      update: "/monetization/billing-record/",
      delete: "/monetization/billing-record/",
    };
  }
}

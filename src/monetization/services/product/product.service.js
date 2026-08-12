import BaseApi from "../../../services/base/api.service";

export default class PlatformProductService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/platform-infrastructure/product/",
      create: "/platform-infrastructure/product/",
      update: "/platform-infrastructure/product/",
      delete: "/platform-infrastructure/product/",
    };
  }
}

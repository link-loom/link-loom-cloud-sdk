import BaseApi from "../../base/api.service";

export default class SupportNamespaceService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/support/namespace/",
      create: "/support/namespace",
      update: "/support/namespace",
      delete: "/support/namespace",
    };
  }
}

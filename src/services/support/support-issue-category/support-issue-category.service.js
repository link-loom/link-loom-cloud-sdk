import BaseApi from "../../base/api.service";

export default class SupportIssueCategoryService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/support/issue-category/",
      create: "/support/issue-category",
      update: "/support/issue-category",
      delete: "/support/issue-category",
    };
  }
}

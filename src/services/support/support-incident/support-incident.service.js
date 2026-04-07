import BaseApi from "../../base/api.service";

export default class SupportIncidentService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/support/incident/",
      create: "/support/incident",
      update: "/support/incident",
      delete: "/support/incident",
    };
  }
}

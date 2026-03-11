import BaseApi from "../../base/api.service";

export default class AppEngineAppFileService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/file/",
      create: "/app-engine/file",
      update: "/app-engine/file",
      delete: "/app-engine/file",
      content: "/app-engine/file/content",
      tree: "/app-engine/file/tree",
      applyChanges: "/app-engine/file/apply-changes",
    };
  }

  async getFileContent(payload) {
    return super.get(payload, { endpoint: this.serviceEndpoints.content });
  }

  async getFileTree(payload) {
    return super.get(payload, { endpoint: this.serviceEndpoints.tree });
  }

  async applyChanges(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.applyChanges,
    });
  }
}

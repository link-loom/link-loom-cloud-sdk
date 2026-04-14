import BaseApi from "../../base/api.service";

export default class AppEngineAppSessionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/app-engine/session/",
      create: "/app-engine/session",
      update: "/app-engine/session",
      delete: "/app-engine/session",
      open: "/app-engine/session/open",
      saveViewState: "/app-engine/session/save-view-state",
      saveDraft: "/app-engine/session/save-draft",
      submitOutput: "/app-engine/session/submit-output",
      cancel: "/app-engine/session/cancel",
    };
  }

  async open(payload) {
    return super.post(payload, { endpoint: this.serviceEndpoints.open });
  }

  async saveViewState(payload) {
    return super.patch(payload, {
      endpoint: this.serviceEndpoints.saveViewState,
    });
  }

  async saveDraft(payload) {
    return super.patch(payload, { endpoint: this.serviceEndpoints.saveDraft });
  }

  async submitOutput(payload) {
    return super.patch(payload, {
      endpoint: this.serviceEndpoints.submitOutput,
    });
  }

  async cancel(payload) {
    return super.patch(payload, { endpoint: this.serviceEndpoints.cancel });
  }

  async getById(sessionId) {
    return super.get(
      { search: sessionId },
      { endpoint: `${this.serviceEndpoints.get}id` },
    );
  }
}

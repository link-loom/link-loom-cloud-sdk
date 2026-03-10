import BaseApi from '@/services/base/api.service';

export default class AppEngineAppSessionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/app-engine/session',
      create: '/app-engine/session',
      update: '/app-engine/session',
      delete: '/app-engine/session',
      open: '/app-engine/session/open',
      saveDraft: '/app-engine/session/save-draft',
      submitOutput: '/app-engine/session/submit-output',
      cancel: '/app-engine/session/cancel',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }

  async open(payload) {
    return super.post(payload, { endpoint: this.service_uri.open });
  }

  async saveDraft(payload) {
    return super.patch(payload, { endpoint: this.service_uri.saveDraft });
  }

  async submitOutput(payload) {
    return super.patch(payload, { endpoint: this.service_uri.submitOutput });
  }

  async cancel(payload) {
    return super.patch(payload, { endpoint: this.service_uri.cancel });
  }
}

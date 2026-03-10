import BaseApi from '@/services/base/api.service';

export default class AppEngineAppVersionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/app-engine/version',
      create: '/app-engine/version',
      update: '/app-engine/version',
      delete: '/app-engine/version',
      publish: '/app-engine/version/publish',
      activate: '/app-engine/version/activate',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }

  async publish(payload) {
    return super.post(payload, { endpoint: this.service_uri.publish });
  }

  async activate(payload) {
    return super.patch(payload, { endpoint: this.service_uri.activate });
  }
}

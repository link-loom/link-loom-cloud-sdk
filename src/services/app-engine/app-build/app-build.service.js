import BaseApi from '@/services/base/api.service';

export default class AppEngineAppBuildService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      buildSingle: '/app-engine/build/single',
      buildAll: '/app-engine/build/all',
      buildAndPublish: '/app-engine/build/publish',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }

  async buildSingle(payload) {
    return super.post(payload, { endpoint: this.service_uri.buildSingle });
  }

  async buildAll(payload) {
    return super.post(payload, { endpoint: this.service_uri.buildAll });
  }

  async buildAndPublish(payload) {
    return super.post(payload, { endpoint: this.service_uri.buildAndPublish });
  }
}

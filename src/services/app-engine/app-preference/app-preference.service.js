import BaseApi from '@/services/base/api.service';

export default class AppEngineAppPreferenceService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/app-engine/preference',
      create: '/app-engine/preference',
      update: '/app-engine/preference',
      delete: '/app-engine/preference',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }
}

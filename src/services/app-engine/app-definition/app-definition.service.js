import BaseApi from '@/services/base/api.service';

export default class AppEngineAppDefinitionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/app-engine/definition',
      create: '/app-engine/definition',
      update: '/app-engine/definition',
      delete: '/app-engine/definition',
      createWithScaffold: '/app-engine/definition/scaffold',
      studioPayload: '/app-engine/definition/studio',
      catalog: '/app-engine/definition/catalog',
      fullApp: '/app-engine/definition/full',
      provision: '/app-engine/definition/provision',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }

  async createWithScaffold(payload) {
    return super.post(payload, { endpoint: this.service_uri.createWithScaffold });
  }

  async getStudioPayload(payload) {
    return super.get(payload, { endpoint: this.service_uri.studioPayload });
  }

  async getCatalog(payload) {
    return super.get(payload, { endpoint: this.service_uri.catalog });
  }

  async getFullApp(payload) {
    return super.get(payload, { endpoint: this.service_uri.fullApp });
  }

  async provision(payload) {
    return super.post(payload, { endpoint: this.service_uri.provision });
  }
}

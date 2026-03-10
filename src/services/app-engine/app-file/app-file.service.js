import BaseApi from '@/services/base/api.service';

export default class AppEngineAppFileService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.service_uri = {
      get: '/app-engine/file',
      create: '/app-engine/file',
      update: '/app-engine/file',
      delete: '/app-engine/file',
      content: '/app-engine/file/content',
      tree: '/app-engine/file/tree',
      applyChanges: '/app-engine/file/apply-changes',
    };
    this.settings = args?.settings || {};

    const baseUrl = args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '';
    if (baseUrl) {
      this.serviceEndpoints.baseUrlProduction = baseUrl;
      this.serviceEndpoints.baseUrlDevelopment = baseUrl;
      this.serviceEndpoints.baseUrlLocal = baseUrl;
    }
  }

  async getFileContent(payload) {
    return super.get(payload, { endpoint: this.service_uri.content });
  }

  async getFileTree(payload) {
    return super.get(payload, { endpoint: this.service_uri.tree });
  }

  async applyChanges(payload) {
    return super.post(payload, { endpoint: this.service_uri.applyChanges });
  }
}

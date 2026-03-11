import BaseApi from '../../base/api.service';

export default class AppEngineAppScaffoldService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || '';
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '',
      get: '/app-engine/scaffold/',
    };
  }

  async getAll() {
    return super.getByParameters({
      queryselector: 'all',
    });
  }

  async getBySlug(slug) {
    return super.getByParameters({
      queryselector: 'slug',
      search: slug,
    });
  }
}

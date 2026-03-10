import axios from 'axios';

class AppEngineClient {
  constructor({ baseUrl, timeout = 30000 }) {
    if (!baseUrl) {
      throw new Error('AppEngineClient requires a baseUrl');
    }

    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._http = axios.create({
      baseURL: this._baseUrl,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ─── App Definition ──────────────────────────────────────

  async getAppDefinition({ queryselector, search, page, pageSize, exclude_status }) {
    const params = { search, page, pageSize, exclude_status };

    return this.#get(`/app/definition/${queryselector}`, params);
  }

  async getAppsCatalog({ owning_product, page, pageSize } = {}) {
    const params = { owning_product, page, pageSize };

    return this.#get('/app/definition/catalog/', params);
  }

  async getFullApp({ slug }) {
    return this.#get('/app/definition/full/', { slug });
  }

  async getStudioPayload({ search }) {
    return this.#get('/app/definition/studio/', { search });
  }

  async createAppDefinition(data) {
    return this.#post('/app/definition/', data);
  }

  async createAppWithScaffold(data) {
    return this.#post('/app/definition/scaffold/', data);
  }

  async updateAppDefinition(data) {
    return this.#patch('/app/definition/', data);
  }

  async deleteAppDefinition({ id }) {
    return this.#delete('/app/definition/', { id });
  }

  // ─── App Version ─────────────────────────────────────────

  async getAppVersion({ queryselector, search, page, pageSize }) {
    const params = { search, page, pageSize };

    return this.#get(`/app/version/${queryselector}`, params);
  }

  async createAppVersion(data) {
    return this.#post('/app/version/', data);
  }

  async updateAppVersion(data) {
    return this.#patch('/app/version/', data);
  }

  async publishVersion({ app_definition_id, changelog, published_by }) {
    return this.#post('/app/version/publish/', { app_definition_id, changelog, published_by });
  }

  async activateVersion({ id }) {
    return this.#patch('/app/version/activate/', { id });
  }

  async deleteAppVersion({ id }) {
    return this.#delete('/app/version/', { id });
  }

  // ─── App File ────────────────────────────────────────────

  async getAppFile({ queryselector, search, page, pageSize }) {
    const params = { search, page, pageSize };

    return this.#get(`/app/file/${queryselector}`, params);
  }

  async getFileTree({ search }) {
    return this.#get('/app/file/tree/', { search });
  }

  async getFileContent({ search }) {
    return this.#get('/app/file/content/', { search });
  }

  async createAppFile(data) {
    return this.#post('/app/file/', data);
  }

  async updateAppFile(data) {
    return this.#patch('/app/file/', data);
  }

  async deleteAppFile({ id }) {
    return this.#delete('/app/file/', { id });
  }

  async applyFileChanges({ app_definition_id, organization_id, changes }) {
    return this.#post('/app/file/apply-changes/', {
      app_definition_id,
      organization_id,
      changes,
    });
  }

  // ─── App Build ───────────────────────────────────────────

  async buildApp({ slug, app_definition_id }) {
    return this.#post('/app/build/single/', { slug, app_definition_id });
  }

  async buildAllApps({ owning_product } = {}) {
    return this.#post('/app/build/all/', { owning_product });
  }

  async buildAndPublish({ slug, app_definition_id, changelog, published_by }) {
    return this.#post('/app/build/publish/', {
      slug,
      app_definition_id,
      changelog,
      published_by,
    });
  }

  // ─── HTTP helpers ────────────────────────────────────────

  async #get(path, params = {}) {
    try {
      const cleanParams = this.#cleanParams(params);
      const response = await this._http.get(path, { params: cleanParams });

      return response.data;
    } catch (error) {
      return this.#handleError(error);
    }
  }

  async #post(path, data = {}) {
    try {
      const response = await this._http.post(path, data);

      return response.data;
    } catch (error) {
      return this.#handleError(error);
    }
  }

  async #patch(path, data = {}) {
    try {
      const response = await this._http.patch(path, data);

      return response.data;
    } catch (error) {
      return this.#handleError(error);
    }
  }

  async #delete(path, data = {}) {
    try {
      const response = await this._http.delete(path, { data });

      return response.data;
    } catch (error) {
      return this.#handleError(error);
    }
  }

  #cleanParams(params) {
    const clean = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        clean[key] = value;
      }
    }

    return clean;
  }

  #handleError(error) {
    if (error.response) {
      return error.response.data || {
        success: false,
        status: error.response.status,
        message: error.response.statusText,
      };
    }

    return {
      success: false,
      status: 500,
      message: error.message || 'Network error',
    };
  }
}

export { AppEngineClient };

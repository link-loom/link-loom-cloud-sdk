import axios from 'axios';

export default class BaseApi {
  constructor () {
    this.api_key = null;
    this.client = null;
    this.serviceEndpoints = {
      baseUrlProduction: process.env.VERIPASS_PRODUCTION_SERVICE_URL,
      baseUrlDevelopment: process.env.VERIPASS_DEVELOPMENT_SERVICE_URL,
      baseUrlLocal: process.env.VERIPASS_LOCAL_SERVICE_URL,
      get: '',
      create: '',
      update: '',
      delete: '',
      patch: '',
      put: '',
    };
    this.settings = {}
  }

  /**
   * Initializes and returns an Axios client instance with the necessary headers and configurations.
   *
   * @returns {Object} Axios client instance.
   */
  request () {
    let headers = {
      Accept: 'application/json',
    };

    if (this.api_key) {
      headers['api-key'] = this.api_key;
    }

    this.client = axios.create({
      baseURL: this.api_url,
      timeout: 31000,
      headers: headers,
    });

    return this.client;
  }

  urlBuilder ({ endpoint }) {
    const environment = this.settings?.environment || 'production';
    let baseUrl = '';

    switch (environment) {
      case 'local':
        baseUrl = this.serviceEndpoints.baseUrlLocal;
        break;
      case 'development':
        baseUrl = this.serviceEndpoints.baseUrlDevelopment;
        break;
      case 'production':
      default:
        baseUrl = this.serviceEndpoints.baseUrlProduction
        break;
    }

    return `${baseUrl}${endpoint}`;
  }

  /**
   * Serializes a nested object into a query string format.
   *
   * @param {Object} obj The object to be serialized.
   * @param {string} [prefix] Prefix for nested properties in the object.
   * @returns {string} Serialized query string.
   */
  serializerOjectToQueryString (obj, prefix) {
    if (obj && typeof obj === 'object') {
      const serializedArr = [];
      let key = {};

      for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const k = prefix ? prefix + '[' + key + ']' : key;
          const value = obj[key] || null;
          serializedArr.push(
            value !== null && typeof value === 'object'
              ? this.serializerOjectToQueryString(value, k)
              : encodeURIComponent(k) + '=' + encodeURIComponent(value),
          );
        }
      }
      return serializedArr.join('&');
    }
  }

  /**
   * Converts an object into a query string format.
   *
   * @param {Object} obj The object to be converted.
   * @returns {string} Query string starting with '?' or an empty string if the object is not valid.
   */
  objectToQueryString (obj) {
    if (obj && typeof obj === 'object') {
      const result = this.serializerOjectToQueryString(obj);
      return `?${result}`;
    } else {
      return '';
    }
  }

  /**
   * Execute a query to filter by parameters
   * @param {Object} payload Provides all information to get an entity by parameters
   * @param {string} payload.queryselector Is the selector of filter
   * @param {*} settings Configuration settings for the request
   * @returns an object to be processed
   */
  async getByParameters (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      if (!payload.queryselector) {
        console.error('Provide a query selector to query');
        return null;
      }

      const parameters = this.objectToQueryString(payload);
      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.get });
      const url = `${endpoint}${payload.queryselector}${parameters}`;

      const result = await this.request().get(url);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }

  /**
   * Execute a create query into backend service
   * @param {*} payload
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async create (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.create });
      const result = await this.request().post(endpoint, payload);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.response?.data || null;
    }
  }

  /**
   * Execute an update query into backend service
   * @param {*} payload
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async update (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.update });
      const result = await this.request().patch(endpoint, payload);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }

  /**
   * Execute a delete query into backend service
   * @param {*} payload
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async delete (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.delete });
      const result = await this.request().delete(endpoint,
        {
          data: payload,
        },
      );

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }

  /**
   * Execute a post query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async post (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.post });
      const result = await this.request().post(endpoint, payload);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.response?.data;
    }
  }

  /**
   * Execute a put query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */

  async put (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.put });
      const result = await this.request().put(endpoint, payload);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.response?.data;
    }
  }

  /**
   * Execute a patch query
   * @param {*} payload Define what data need to be posted
   * @param {*} settings Configuration settings for the request
   * @returns
   */
  async patch (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.patch });
      const result = await this.request().patch(endpoint, payload);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.response?.data;
    }
  }

  /**
   * Execute a query get query
   * @param {*} payload
   * @param {*} endpoint
   * @returns
   */
  async get (payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const parameters = this.objectToQueryString(payload);
      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.post });
      const result = await this.request().get(`${endpoint}${parameters}`);

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }
}

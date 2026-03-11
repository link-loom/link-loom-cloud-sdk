import axios from "axios";

export default class BaseApi {
  constructor(args) {
    this.api_key = null;
    this.client = null;
    this.serviceEndpoints = {
      baseUrl: import.meta.env.VITE_APP_BACKEND_URL || "",
      get: "",
      create: "",
      update: "",
      delete: "",
      patch: "",
      put: "",
    };
    this.settings = args || {};
  }

  /**
   * Initializes and returns an Axios client instance with the necessary headers and configurations.
   *
   * @param {Object} settings Optional settings to override instance defaults during the request.
   * @returns {Object} Axios client instance.
   */
  request(settings = null) {
    let headers = {
      Accept: "application/json",
    };

    if (this.api_key) {
      headers["api-key"] = this.api_key;
    }

    const mergedSettings = { ...this.settings, ...settings };

    this.client = axios.create({
      baseURL: this.api_url,
      timeout: mergedSettings?.timeout || 31000,
      headers: headers,
    });

    return this.client;
  }

  urlBuilder({ endpoint }) {
    return `${this.serviceEndpoints.baseUrl}${endpoint}`;
  }

  /**
   * Serializes a nested object into a query string format.
   *
   * @param {Object} obj The object to be serialized.
   * @param {string} [prefix] Prefix for nested properties in the object.
   * @returns {string} Serialized query string.
   */
  serializerOjectToQueryString(obj, prefix) {
    if (obj && typeof obj === "object") {
      const serializedArr = [];
      let key = {};

      for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const k = prefix ? prefix + "[" + key + "]" : key;
          const value = obj[key] || null;
          serializedArr.push(
            value !== null && typeof value === "object"
              ? this.serializerOjectToQueryString(value, k)
              : encodeURIComponent(k) + "=" + encodeURIComponent(value),
          );
        }
      }
      return serializedArr.join("&");
    }
  }

  /**
   * Converts an object into a query string format.
   *
   * @param {Object} obj The object to be converted.
   * @returns {string} Query string starting with '?' or an empty string if the object is not valid.
   */
  objectToQueryString(obj) {
    if (obj && typeof obj === "object") {
      const result = this.serializerOjectToQueryString(obj);
      return `?${result}`;
    } else {
      return "";
    }
  }

  /**
   * Execute a query to filter by parameters
   * @param {Object} payload Provides all information to get an entity by parameters
   * @param {string} payload.queryselector Is the selector of filter
   * @param {*} settings Configuration settings for the request
   * @returns an object to be processed
   */
  async getByParameters(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      if (!payload.queryselector) {
        console.error("Provide a query selector to query");
        return null;
      }

      const parameters = this.objectToQueryString(payload);
      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.get,
      });
      const url = `${endpoint}${payload.queryselector}${parameters}`;

      const result = await this.request(settings).get(url);

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
  async create(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.create,
      });
      const result = await this.request(settings).post(endpoint, payload);

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
  async update(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.update,
      });
      const result = await this.request(settings).patch(endpoint, payload);

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
  async delete(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.delete,
      });
      const result = await this.request(settings).delete(endpoint, {
        data: payload,
      });
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
  async post(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.post,
      });
      const result = await this.request(settings).post(endpoint, payload);

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

  async put(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.put,
      });
      const result = await this.request(settings).put(endpoint, payload);

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
  async patch(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.patch,
      });
      const result = await this.request(settings).patch(endpoint, payload);

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
  async get(payload, settings) {
    try {
      if (!payload) {
        return null;
      }

      const parameters = this.objectToQueryString(payload);
      const endpoint = this.urlBuilder({
        endpoint: settings?.endpoint || this.serviceEndpoints.get,
      });
      const result = await this.request(settings).get(
        `${endpoint}${parameters}`,
      );

      return result.data;
    } catch (error) {
      console.error(error);
      return error?.body;
    }
  }
}

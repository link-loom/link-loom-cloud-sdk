import BaseApi from "./api.service";

/**
 * A Link Loom Cloud client that acts as the signed-in person. Every request carries the headers
 * `getHeaders()` returns at that moment (the Veripass token and the organization, see
 * `buildIdentityHeaders`), so the backend resolves the organization from the principal and never
 * from the payload. Failures resolve to the backend's envelope (`{ success: false, status, message,
 * error_code }`) instead of `undefined`, so a screen can tell "not found" from "not entitled" from
 * "offline".
 */
export default class IdentityApi extends BaseApi {
  constructor(args) {
    super(args);

    this._getHeaders = args?.getHeaders;
  }

  static failure(status, message) {
    return { success: false, status, message: message || "", result: null };
  }

  static envelopeFrom(error) {
    const envelope = error?.response?.data;

    if (envelope && typeof envelope === "object" && "success" in envelope) {
      return { status: error.response.status, ...envelope };
    }

    return IdentityApi.failure(error?.response?.status || 0, error?.message);
  }

  request(settings = null) {
    const injected = typeof this._getHeaders === "function" ? this._getHeaders() || {} : {};

    return super.request({ ...settings, headers: { ...injected, ...(settings?.headers || {}) } });
  }

  queryString(query) {
    const serialized = this.serializerOjectToQueryString(query || {});

    return serialized ? `?${serialized}` : "";
  }

  async getByParameters(payload, settings) {
    if (!payload?.queryselector) {
      return IdentityApi.failure(400, "Provide a query selector to query");
    }

    try {
      const { queryselector, ...query } = payload;
      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.get });
      const response = await this.request(settings).get(`${endpoint}${queryselector}${this.queryString(query)}`);

      return response.data;
    } catch (error) {
      return IdentityApi.envelopeFrom(error);
    }
  }

  async post(payload, settings) {
    try {
      const endpoint = this.urlBuilder({ endpoint: settings?.endpoint || this.serviceEndpoints.post });
      const response = await this.request(settings).post(endpoint, payload ?? {});

      return response.data;
    } catch (error) {
      return IdentityApi.envelopeFrom(error);
    }
  }
}

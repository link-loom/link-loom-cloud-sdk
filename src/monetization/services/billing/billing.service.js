import BaseApi from "../../../services/base/api.service";

/**
 * MonetizationBillingService — a subject's billing: plan, usage, access, invoices and fiscal profile.
 *
 * Authentication is injected, never assumed: `getHeaders()` returns the caller's headers on every
 * request. A customer surface sends its Veripass identity (see `identityHeaders`) and the backend
 * resolves the billing subject from it; an operator console sends its API key and names the subject.
 *
 * Unlike the base service, failures come back as the backend's envelope — `{ success: false, status,
 * message, result }` — so a screen can tell an expired session (401) from a missing permission (403)
 * from a network problem.
 */
export default class MonetizationBillingService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this._getHeaders = args?.getHeaders;
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      get: "/monetization/billing/",
      saveProfile: "/monetization/billing/save-profile",
      document: "/monetization/billing-document/",
    };
  }

  /**
   * Headers for a customer acting on behalf of an organization, from a Veripass session
   * (`useAuth().getToken()`). The organization defaults to the session's active membership.
   */
  static identityHeaders(session, organizationId) {
    const token = session?.token;

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
      "x-veripass-organization-identity":
        organizationId ||
        session?.memberships?.active?.organization_id ||
        session?.payload?.organization_id ||
        "",
    };
  }

  request(settings = null) {
    const client = super.request(settings);
    const injected =
      typeof this._getHeaders === "function" ? this._getHeaders() || {} : {};

    Object.entries(injected).forEach(([name, value]) => {
      if (value) {
        client.defaults.headers[name] = value;
      }
    });

    return client;
  }

  async getByParameters(payload, settings) {
    try {
      if (!payload?.queryselector) {
        return this.#failure(400, "Provide a query selector to query");
      }

      const { queryselector, ...query } = payload;
      const url = `${this.urlBuilder({ endpoint: this.serviceEndpoints.get })}${queryselector}${this.objectToQueryString(this.#present(query))}`;
      const response = await this.request(settings).get(url);

      return response.data;
    } catch (error) {
      return this.#envelopeFrom(error);
    }
  }

  async saveProfile(payload, settings) {
    try {
      const response = await this.request(settings).post(
        this.urlBuilder({ endpoint: this.serviceEndpoints.saveProfile }),
        payload,
      );

      return response.data;
    } catch (error) {
      return this.#envelopeFrom(error);
    }
  }

  /**
   * Fetch a document with the caller's headers (a plain link cannot carry them). Resolves with the
   * bytes and the server's filename, or with the failure envelope.
   */
  async getDocument({ queryselector, ...query }, settings) {
    try {
      const url = `${this.urlBuilder({ endpoint: this.serviceEndpoints.document })}${queryselector}${this.objectToQueryString(this.#present(query))}`;
      const response = await this.request({ timeout: 60000, ...settings }).get(
        url,
        { responseType: "blob" },
      );
      const disposition = response.headers?.["content-disposition"] || "";
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);

      return {
        success: true,
        blob: response.data,
        filename: match ? decodeURIComponent(match[1]) : "",
      };
    } catch (error) {
      const blob = error?.response?.data;

      if (blob && typeof blob.text === "function") {
        try {
          return JSON.parse(await blob.text());
        } catch (parseError) {
          return this.#failure(error.response.status, error.message);
        }
      }

      return this.#envelopeFrom(error);
    }
  }

  #envelopeFrom(error) {
    const envelope = error?.response?.data;

    if (envelope && typeof envelope === "object" && "success" in envelope) {
      return envelope;
    }

    return this.#failure(error?.response?.status || 0, error?.message);
  }

  #failure(status, message) {
    return { success: false, status, message: message || "", result: null };
  }

  #present(query) {
    return Object.fromEntries(
      Object.entries(query || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );
  }
}

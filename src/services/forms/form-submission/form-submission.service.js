import BaseApi from "../../base/api.service";

/**
 * Client helper to capture form submissions (Netlify-Forms style).
 * Authenticated with a workload API key (sent as the `api-key` header by BaseApi).
 *
 * Usage:
 *   const forms = new FormsSubmissionService({ apiKey, baseUrl });
 *   await forms.submitForm({ slug: "contact", email, message });
 */
export default class FormsSubmissionService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_APP_BACKEND_URL || "",
      submit: "/forms/submission",
    };
  }

  /**
   * Submit a form. `payload` must include `slug`; every other field is captured as-is.
   * @param {object} payload - e.g. { slug: "contact", email, message }
   * @param {object} [settings] - optional request settings
   */
  async submitForm(payload, settings) {
    return super.post(payload, { endpoint: this.serviceEndpoints.submit, ...settings });
  }
}

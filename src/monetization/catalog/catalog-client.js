/**
 * PricingCatalogClient — read a pricing page that is ready to draw.
 *
 * Framework-agnostic on purpose. Most of the sites that render pricing are static builds, not React
 * apps, so this uses the global `fetch` and takes every setting from its constructor — no bundler
 * environment, no framework, nothing that stops it running in a build script or in Node.
 *
 * The response needs no interpreting. Prices are resolved for the requested cycle, feature lines are
 * already worded in the requested language, and each plan carries the `slug` and `card_variant` a
 * consumer styles by. Formatting rules stay on the server, which is the whole point: the moment a
 * page owns its own template, two pages start describing the same plan differently.
 *
 * Usage:
 *   const catalog = new PricingCatalogClient({ baseUrl: "https://api.example.com" });
 *   const page = await catalog.getPage({ slug: "public", locale: "es", cycle: "annual" });
 */
const DEFAULT_TIMEOUT_MS = 31000;

export default class PricingCatalogClient {
  constructor(args) {
    this._baseUrl = (args?.baseUrl || "").replace(/\/$/, "");
    this._apiKey = args?.apiKey || "";
    this._timeoutMs = args?.timeoutMs || DEFAULT_TIMEOUT_MS;
    this._locale = args?.locale || "en";
  }

  /**
   * A pricing page, resolved and ready to render.
   *
   * @param {object} params
   * @param {string} params.slug - Catalog slug, e.g. "public".
   * @param {string} [params.productId] - Only needed when two products share a catalog slug.
   * @param {string} [params.locale] - Language to render copy in. Falls back to English per string.
   * @param {string} [params.cycle] - Billing cycle to price, e.g. "monthly" or "annual".
   * @param {boolean} [params.includeDraft] - Include unpublished drafts. For previews only.
   *
   * @returns {Promise<PricingPage|null>} The page, or null when it could not be read.
   */
  async getPage({ slug, productId, locale, cycle, includeDraft } = {}) {
    if (!slug) {
      return null;
    }

    const query = new URLSearchParams({ search: slug });

    if (productId) query.set("product_id", productId);
    query.set("locale", locale || this._locale);
    if (cycle) query.set("cycle", cycle);
    if (includeDraft) query.set("include_draft", "true");

    const response = await this.#get(
      `/monetization/plan-catalog/rendered?${query.toString()}`,
    );

    return response?.success ? response.result : null;
  }

  /**
   * Every cycle of a page in one read, so a cycle toggle can switch without a round trip.
   */
  async getPageWithCycles({ slug, productId, locale, includeDraft } = {}) {
    const first = await this.getPage({ slug, productId, locale, includeDraft });

    if (!first) {
      return null;
    }

    const cycles = first.catalog?.cycles || [];
    const byCycle = { [first.catalog.cycle]: first.plans };

    for (const entry of cycles) {
      if (byCycle[entry.cycle]) {
        continue;
      }

      const page = await this.getPage({
        slug,
        productId,
        locale,
        includeDraft,
        cycle: entry.cycle,
      });

      if (page) {
        byCycle[entry.cycle] = page.plans;
      }
    }

    return { catalog: first.catalog, plansByCycle: byCycle };
  }

  /**
   * What one subject is on and what they have used this period.
   *
   * The shape a billing screen draws directly: the plan, the period, the price agreed, and one entry
   * per metric pairing what was used against what is allowed.
   */
  async getSubscriptionSummary({ subjectIdentity, subjectType, product } = {}) {
    if (!subjectIdentity) {
      return null;
    }

    const query = new URLSearchParams({ search: subjectIdentity });

    if (subjectType) query.set("subject_type", subjectType);
    if (product) query.set("product", product);

    const response = await this.#get(
      `/monetization/usage-counter/summary?${query.toString()}`,
    );

    return response?.success ? response.result : null;
  }

  /**
   * The periods a subscription has been through, newest first.
   */
  async getBillingHistory({ subscriptionId, subjectIdentity } = {}) {
    const selector = subscriptionId ? "subscription-id" : "subject";
    const search = subscriptionId || subjectIdentity;

    if (!search) {
      return [];
    }

    const response = await this.#get(
      `/monetization/billing-record/${selector}?search=${encodeURIComponent(search)}`,
    );

    return response?.success ? response.result?.items || [] : [];
  }

  async #get(endpoint) {
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), this._timeoutMs)
      : null;

    try {
      const response = await fetch(`${this._baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(this._apiKey ? { "api-key": this._apiKey } : {}),
        },
        signal: controller?.signal,
      });

      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}

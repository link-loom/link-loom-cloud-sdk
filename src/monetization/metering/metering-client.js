/**
 * MeteringClient — report a use and find out whether it was allowed, in one call.
 *
 * Works in Node (service-to-service) and in the browser: it uses the global `fetch` and takes every
 * setting from its constructor, so it never depends on a bundler-injected environment.
 *
 * Usage:
 *   const metering = new MeteringClient({ baseUrl, apiKey, product: "sommatic-ai" });
 *   const decision = await metering.report({
 *     subject: { identity: "veripass-abc", type: "organization" },
 *     metric: "workflow.runs.monthly",
 *   });
 *   if (!decision.allowed) { ... }
 *
 * Two things about the subject that are easy to get wrong:
 *   - The API key says WHO IS ASKING. The subject says WHOSE ALLOWANCE. They are not the same thing,
 *     and the subject is yours to choose — a person, an organization, whatever you track.
 *   - Naming a subject nobody has seen does not create an allowance. The ceiling always comes from
 *     the subscription. A feature that genuinely grants per subject is defined that way on the server.
 *
 * DELIBERATE DIVERGENCE from the other transport clients in this SDK, which return `null` on a
 * network failure: for a gate, `null` is ambiguous between "denied" and "unreachable", and a caller
 * writing `if (!result.allowed)` would throw on it. This one ALWAYS returns a shaped decision. On a
 * transport failure it FAILS OPEN by default, flagged `degraded: true` — a metering outage must not
 * take the product down with it. Pass `failureMode: "deny"` if refusing is the safer answer for you.
 */
const DEFAULT_TIMEOUT_MS = 31000;

export class QuotaExceededError extends Error {
  constructor(decision) {
    super(
      `Not allowed: ${decision?.reason || "quota exceeded"} for ${decision?.metric || "this metric"}`,
    );
    this.name = "QuotaExceededError";
    this.decision = decision;
  }
}

export default class MeteringClient {
  constructor(args) {
    this._baseUrl = (args?.baseUrl || "").replace(/\/$/, "");
    this._apiKey = args?.apiKey || "";
    this._product = args?.product || null;
    this._subject = args?.subject || null;
    this._timeoutMs = args?.timeoutMs || DEFAULT_TIMEOUT_MS;
    this._failureMode = args?.failureMode === "deny" ? "deny" : "allow";
  }

  /**
   * Count a use and get the decision.
   *
   * @param {object} params
   * @param {string} params.metric - The exact metric string from the feature catalog.
   * @param {object} [params.subject] - `{ identity, type }`. Defaults to the client's subject.
   * @param {string} [params.product] - Product id, slug or alias. Defaults to the client's product.
   * @param {number} [params.quantity] - Whole units. Defaults to 1.
   * @param {string} [params.idempotencyKey] - Supply when a retry could count twice.
   * @param {string} [params.value] - Requested option, for a choice-type feature.
   *
   * @returns {Promise<Decision>} Always a decision, never null.
   */
  async report({
    metric,
    subject,
    product,
    quantity,
    idempotencyKey,
    value,
  } = {}) {
    return this.#post("/monetization/usage/report", {
      metric,
      subject,
      product,
      quantity,
      idempotencyKey,
      value,
    });
  }

  /**
   * The same decision, without counting.
   *
   * Use it before work that is expensive to do and wasteful to throw away — a build, a render, a
   * model call. Because reporting and authorizing are one call, this is the only way to ask first.
   */
  async check({ metric, subject, product, quantity, value } = {}) {
    return this.#post("/monetization/usage/check", {
      metric,
      subject,
      product,
      quantity,
      value,
    });
  }

  /**
   * Report several metrics for one operation, in sequence.
   *
   * Returns every decision. Deliberately does NOT stop at the first refusal and does not roll back
   * what it already counted: reversing a report is not something the engine offers yet, so pretending
   * otherwise here would be a lie. Call `check` first when several metrics must succeed together.
   */
  async reportMany(entries, shared = {}) {
    const decisions = [];

    for (const entry of entries || []) {
      decisions.push(await this.report({ ...shared, ...entry }));
    }

    return decisions;
  }

  /**
   * Report, then run the work only if it was allowed.
   *
   * Throws `QuotaExceededError` when it was not, so a caller can catch by type.
   */
  async guard({ metric, subject, product, quantity, idempotencyKey }, work) {
    const decision = await this.report({
      metric,
      subject,
      product,
      quantity,
      idempotencyKey,
    });

    if (!decision.allowed) {
      throw new QuotaExceededError(decision);
    }

    return typeof work === "function" ? work(decision) : decision;
  }

  async #post(endpoint, input) {
    const subject = input.subject || this._subject || {};
    const body = {
      product: input.product || this._product,
      subject_identity: subject.identity || subject.id || null,
      subject_type: subject.type || null,
      metric: input.metric,
      quantity: input.quantity,
      value: input.value,
      ...(input.idempotencyKey
        ? { idempotency_key: input.idempotencyKey }
        : {}),
    };

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), this._timeoutMs)
      : null;

    try {
      const response = await fetch(`${this._baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(this._apiKey ? { "api-key": this._apiKey } : {}),
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      const payload = await response.json();

      if (!payload?.success) {
        return this.#unavailable(input.metric, payload?.message);
      }

      return payload.result;
    } catch (error) {
      console.error(error);
      return this.#unavailable(input.metric, error?.message);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  #unavailable(metric, message) {
    const allowed = this._failureMode !== "deny";

    return {
      allowed,
      action: allowed ? "allow" : "deny",
      reason: "metering_unavailable",
      message: message || null,
      metric: metric || null,
      used: null,
      limit: null,
      remaining: null,
      warning: null,
      degraded: true,
    };
  }
}

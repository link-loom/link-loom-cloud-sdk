/**
 * EventBusProducer — publish durable messages to a Link Loom Cloud Event Bus topic.
 *
 * Works in Node (service-to-service) and in the browser: it uses the global `fetch` (Node 18+), like
 * SignalConsumer, so it never depends on a bundler-injected environment.
 *
 * Usage:
 *   const producer = new EventBusProducer({ baseUrl, apiKey });
 *   await producer.publish({
 *     topic: "billing",
 *     eventName: "billing.invoice.created",
 *     values: { invoice_id: "inv-1" },
 *   });
 */
export default class EventBusProducer {
  constructor(args) {
    this._baseUrl = (args?.baseUrl || "").replace(/\/$/, "");
    this._apiKey = args?.apiKey || "";
    this._organizationId = args?.organizationId || null;
    this._timeoutMs = args?.timeoutMs || 31000;
  }

  /**
   * Append a message to a topic's durable log and fan it out to live consumers.
   *
   * Provide either a full `envelope` or the shorthand `eventName` + `values`. The routing key is always
   * `context.event.name`; `partitionKey` decides the partition (defaults to the routing key), which is what
   * guarantees per-key ordering.
   *
   * @param {Object} args
   * @param {string} args.topic - Topic slug.
   * @param {string} [args.eventName] - Routing key, e.g. "billing.invoice.created".
   * @param {Object} [args.values] - Domain payload.
   * @param {Object} [args.envelope] - A pre-built canonical envelope (overrides eventName/values).
   * @param {string} [args.command] - "#request" (default) or "#response".
   * @param {string} [args.partitionKey] - Partition selector; defaults to the routing key.
   * @param {string} [args.correlationId] - Trace id; generated server-side when omitted.
   * @returns {Promise<Object>} `{ message, delivered_count }` on success.
   */
  async publish({
    topic,
    eventName,
    values,
    envelope,
    command,
    partitionKey,
    correlationId,
    source,
    organizationId,
  } = {}) {
    return this.#post("/communication/event-bus/produce", {
      topic,
      envelope,
      event_name: eventName,
      values,
      command,
      partition_key: partitionKey,
      correlation_id: correlationId,
      source,
      organization_id: organizationId || this._organizationId,
    });
  }

  /**
   * Reset a consumer group's committed offset on a partition — the replay primitive.
   *
   * @param {Object} args
   * @param {string} args.topic
   * @param {string} args.group
   * @param {number} args.partition
   * @param {string|number} args.position - "earliest", "latest", or an absolute offset.
   */
  async seek({ topic, group, partition, position } = {}) {
    return this.#post("/communication/event-bus/seek", {
      topic,
      group,
      partition,
      position,
    });
  }

  /** Re-produce a dead-lettered message onto its topic. */
  async requeue(deadLetterId) {
    return this.#post("/communication/event-bus/requeue", { id: deadLetterId });
  }

  /** Apply retention now. Omit `topic` to sweep every topic. */
  async retention(topic) {
    return this.#post("/communication/event-bus/retention", { topic });
  }

  async #post(endpoint, body) {
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

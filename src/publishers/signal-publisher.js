import BaseApi from "../services/base/api.service";

/**
 * SignalPublisher — send Link Loom Cloud Signals from anywhere (browser or Node).
 *
 * A thin authenticated client over POST /communication/signal/{send,schedule,cancel}.
 *
 * Usage:
 *   const publisher = new SignalPublisher({ apiKey, baseUrl });
 *   await publisher.send("user:U1", "session.revoke", { reason: "admin_forced" });
 */
export default class SignalPublisher extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || import.meta.env.VITE_APP_BACKEND_URL || "",
      send: "/communication/signal/send",
      schedule: "/communication/signal/schedule",
      cancel: "/communication/signal/cancel",
    };
  }

  /** Send a signal to a channel now. */
  async send(channel, name, payload = {}, settings) {
    return super.post(
      { channel, name, payload, ...(settings?.extra || {}) },
      { endpoint: this.serviceEndpoints.send, ...settings },
    );
  }

  /** Schedule a signal for later. `scheduled_at` is an ISO string. */
  async schedule({ channel, name, payload = {}, scheduled_at, ...rest }, settings) {
    return super.post(
      { channel, name, payload, scheduled_at, ...rest },
      { endpoint: this.serviceEndpoints.schedule, ...settings },
    );
  }

  /** Cancel a scheduled signal by id. */
  async cancel(id, settings) {
    return super.post({ id }, { endpoint: this.serviceEndpoints.cancel, ...settings });
  }
}

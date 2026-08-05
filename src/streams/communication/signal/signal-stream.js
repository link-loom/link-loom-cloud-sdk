import BaseSignalStream from "../../base/base-signal-stream";

/**
 * SignalStream — browser Signals client bound to the LLC endpoint.
 *
 * Usage:
 *   const stream = new SignalStream({ baseUrl });
 *   stream.setParams({ channels: ["user:U1"], subject_type: "user", subject_id: "U1", platform: "web" });
 *   stream.on("session.revoke", (data) => logout());
 *   stream.connect();
 */
export default class SignalStream extends BaseSignalStream {
  constructor(args) {
    super(args);

    this.streamEndpoints = {
      baseUrl: args?.baseUrl || "",
      stream: "/communication/signal/stream",
    };
  }
}

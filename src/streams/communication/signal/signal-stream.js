import BaseSignalStream from "../../base/base-signal-stream";

/**
 * SignalStream — browser Signals client bound to the LLC endpoint.
 *
 * Usage:
 *   const stream = new SignalStream({ baseUrl });
 *   stream.setParams({ channels: ["user:<veripass_identity>"], access_token, organization_id, platform: "web" });
 *   stream.on("session.revoke", (data) => logout());
 *   stream.connect();
 *
 * `user:{veripass_identity}` and `app-data:*` channels require identity: pass the Veripass user JWT as
 * `access_token` (plus `organization_id`, and `app_session_id` for app-data channels). The stream is
 * rejected when any requested channel is not authorized for that identity.
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

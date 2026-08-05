/**
 * SignalConsumer — server/Node (and isomorphic) SSE consumer for Link Loom Cloud "Signals".
 *
 * Node has no native EventSource, so this consumes the SSE stream via streaming `fetch`
 * (Node 18+ global fetch with a ReadableStream body; also works in browsers). Auto-reconnects.
 *
 * Usage (a system receiving one-way admin commands):
 *   const consumer = new SignalConsumer({ baseUrl, channels: ["system:svc-1"], subjectType: "system", subjectId: "svc-1" });
 *   consumer.on("system.restart", () => process.exit(0));
 *   consumer.connect();
 */
export default class SignalConsumer {
  constructor(args) {
    this._baseUrl = args?.baseUrl || "";
    this._endpoint = "/communication/signal/stream";
    this._params = {
      channels: Array.isArray(args?.channels)
        ? args.channels.join(",")
        : args?.channels || "",
      subject_type: args?.subjectType,
      subject_id: args?.subjectId,
      platform: args?.platform,
      organization_id: args?.organizationId,
    };
    this._reconnectMs = args?.reconnectMs || 3000;
    this._listeners = new Map(); // signalName -> Set<cb>
    this._closed = false;
    this._controller = null;
  }

  on(signalName, callback) {
    if (!this._listeners.has(signalName)) {
      this._listeners.set(signalName, new Set());
    }
    this._listeners.get(signalName).add(callback);
  }

  off(signalName) {
    this._listeners.delete(signalName);
  }

  #buildUrl() {
    const parts = [];
    for (const [key, val] of Object.entries(this._params)) {
      if (val != null && val !== "") {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    }
    const base = `${this._baseUrl}${this._endpoint}`;
    return parts.length ? `${base}?${parts.join("&")}` : base;
  }

  #dispatch(signalName, rawData) {
    const handlers = this._listeners.get(signalName);
    if (!handlers || handlers.size === 0) return;

    let data = rawData;
    try {
      data = JSON.parse(rawData);
    } catch {
      /* keep raw */
    }

    for (const handler of handlers) {
      try {
        handler(data, { type: signalName });
      } catch {
        /* isolate consumer errors */
      }
    }
  }

  #processFrame(frame) {
    let signalName = "message";
    let data = "";

    for (const line of frame.split("\n")) {
      if (line.startsWith(":")) continue; // keep-alive comment
      if (line.startsWith("event:")) signalName = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }

    if (data) {
      this.#dispatch(signalName, data);
    }
  }

  async connect() {
    this._closed = false;

    while (!this._closed) {
      this._controller = new AbortController();

      try {
        const response = await fetch(this.#buildUrl(), {
          headers: { Accept: "text/event-stream" },
          signal: this._controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Signal stream responded ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";

          for (const frame of frames) {
            this.#processFrame(frame);
          }
        }
      } catch (error) {
        if (this._closed) return;
      }

      if (this._closed) return;

      await new Promise((resolve) => setTimeout(resolve, this._reconnectMs));
    }
  }

  disconnect() {
    this._closed = true;
    if (this._controller) {
      this._controller.abort();
      this._controller = null;
    }
  }
}

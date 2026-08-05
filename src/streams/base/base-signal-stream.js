/**
 * BaseSignalStream — browser EventSource wrapper for Link Loom Cloud "Signals".
 *
 * Subscribes to one or more channels over SSE and dispatches named signal events to registered
 * listeners. Auto-reconnects. Browser-only (uses the native EventSource); for Node/servers use
 * SignalConsumer instead.
 */
export default class BaseSignalStream {
  constructor(args) {
    this.streamEndpoints = {
      baseUrl: args?.baseUrl || "",
      stream: "",
    };

    this._source = null;
    // signalName -> Set<handler>. A Set so several consumers can subscribe to the same signal.
    this._listeners = new Map();
    this._closed = false;
    this._reconnectMs = args?.reconnectMs || 3000;
    this._reconnectTimer = null;
    this._params = {};
  }

  /** Set query parameters for the stream URL (channels, subject, platform, token…). */
  setParams(params) {
    this._params = params || {};
  }

  #buildUrl() {
    const parts = [];

    const flatten = (obj, prefix) => {
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;

        if (val && typeof val === "object" && !Array.isArray(val)) {
          flatten(val, fullKey);
        } else if (Array.isArray(val)) {
          parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(val.join(","))}`);
        } else if (val != null) {
          parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(val)}`);
        }
      }
    };

    flatten(this._params);

    const base = `${this.streamEndpoints.baseUrl}${this.streamEndpoints.stream}`;
    return parts.length ? `${base}?${parts.join("&")}` : base;
  }

  /** Connect to the SSE endpoint (browser EventSource). */
  connect() {
    if (this._source) {
      this.disconnect();
    }

    this._closed = false;
    this._source = new EventSource(this.#buildUrl());

    for (const [signalName, handlers] of this._listeners) {
      for (const handler of handlers) {
        this._source.addEventListener(signalName, handler);
      }
    }

    this._source.onerror = () => {
      if (this._closed) return;

      this._source?.close();
      this._reconnectTimer = setTimeout(() => {
        if (!this._closed) {
          this.connect();
        }
      }, this._reconnectMs);
    };
  }

  /** Register a named signal listener. Callback receives parsed JSON data. */
  on(signalName, callback) {
    const handler = (event) => {
      try {
        callback(JSON.parse(event.data), event);
      } catch {
        callback(event.data, event);
      }
    };

    if (!this._listeners.has(signalName)) {
      this._listeners.set(signalName, new Set());
    }
    this._listeners.get(signalName).add(handler);

    if (this._source) {
      this._source.addEventListener(signalName, handler);
    }
  }

  /** Remove ALL listeners registered for a named signal. */
  off(signalName) {
    const handlers = this._listeners.get(signalName);

    if (handlers && this._source) {
      for (const handler of handlers) {
        this._source.removeEventListener(signalName, handler);
      }
    }

    this._listeners.delete(signalName);
  }

  /** Disconnect and clean up. */
  disconnect() {
    this._closed = true;
    clearTimeout(this._reconnectTimer);

    if (this._source) {
      this._source.close();
      this._source = null;
    }
  }

  get connected() {
    return this._source?.readyState === EventSource.OPEN;
  }
}

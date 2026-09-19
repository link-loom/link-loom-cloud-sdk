import { getRealtimeConnectionRegistry } from "./realtime-connection.registry";

// Channels and signal handlers of one consumer (an app session, the notifications bridge, a hook).
// The connection itself is owned by the page-wide registry, which multiplexes consumers over as few
// SSE connections as the backend's channel authorization allows.
export default class AppRealtimeHub {
  constructor({ baseUrl, getParams, shareable = false, registry = getRealtimeConnectionRegistry() }) {
    this.baseUrl = baseUrl;
    this.getParams = getParams;
    // Shareable consumers only use session-independent channels (`user:`) and may ride on any
    // connection of the same identity.
    this.shareable = shareable;
    this._registry = registry;
    this._channelCounts = new Map();
    this._handlers = new Map();
    this._reconnectListeners = new Set();
    this._active = false;
    this._disposed = false;
  }

  channels() {
    return [...this._channelCounts.keys()];
  }

  signalNames() {
    return [...this._handlers.entries()].filter(([, handlers]) => handlers.size).map(([signalName]) => signalName);
  }

  dispatch(signalName, payload, event) {
    const handlers = this._handlers.get(signalName);
    handlers?.forEach((handler) => handler(payload, signalName, event));
  }

  notifyReconnect() {
    this._reconnectListeners.forEach((listener) => listener());
  }

  get connected() {
    return this._registry.isConnected(this);
  }

  ensureStream() {
    if (this._active || this._disposed) {
      return this;
    }
    this._active = true;
    this._registry.register(this);
    return this;
  }

  addChannel(channel) {
    if (!channel || this._disposed) {
      return () => {};
    }

    const count = this._channelCounts.get(channel) || 0;
    this._channelCounts.set(channel, count + 1);
    if (count === 0) {
      this.#channelAdded();
    }

    let removed = false;
    return () => {
      // Unsubscribes that run after dispose (app effects cleaned up late) must not revive the consumer.
      if (removed || this._disposed || !this._channelCounts.has(channel)) {
        return;
      }
      removed = true;
      const remaining = this._channelCounts.get(channel) - 1;
      if (remaining > 0) {
        this._channelCounts.set(channel, remaining);
        return;
      }
      this._channelCounts.delete(channel);
      if (this._active) {
        this._registry.schedule();
      }
    };
  }

  #channelAdded() {
    if (!this._active) {
      this.ensureStream();
      return;
    }
    this._registry.schedule();
  }

  on(signalName, handler) {
    if (this._disposed) {
      return () => {};
    }
    if (!this._handlers.has(signalName)) {
      this._handlers.set(signalName, new Set());
    }
    this._handlers.get(signalName).add(handler);
    if (this._active) {
      this._registry.refreshSignals(this);
    }
    return () => this._handlers.get(signalName)?.delete(handler);
  }

  listen(channel, signalNames, handler) {
    const removeHandlers = signalNames.map((signalName) => this.on(signalName, handler));
    const removeChannel = this.addChannel(channel);
    return () => {
      removeHandlers.forEach((remove) => remove());
      removeChannel();
    };
  }

  onReconnect(callback) {
    this._reconnectListeners.add(callback);
    return () => this._reconnectListeners.delete(callback);
  }

  // Releases this consumer's share of the connection; channels and handlers are kept, so a later
  // `ensureStream()` or `addChannel()` resumes it.
  disconnect() {
    if (!this._active) {
      return;
    }
    this._active = false;
    this._registry.unregister(this);
  }

  // Unmount path: drops every channel, handler and listener and releases the connection.
  dispose() {
    this._disposed = true;
    this.disconnect();
    this._channelCounts.clear();
    this._handlers.clear();
    this._reconnectListeners.clear();
  }
}

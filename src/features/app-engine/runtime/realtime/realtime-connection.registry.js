import { buildSignalStreamUrl } from "../../../../streams/base/base-signal-stream";

const STREAM_PATH = "/communication/signal/stream";
const COALESCE_MS = 250;
const HIDDEN_PAUSE_MS = 60 * 1000;
// Kept while the page is in the background: desktop notifications exist for unfocused tabs.
const BACKGROUND_CHANNEL_PREFIX = "user:";
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30 * 1000;
// A lane that lived at least this long counts as a working connection and earns a fresh backoff.
const STABLE_CONNECTION_MS = 10 * 1000;
const EVENT_SOURCE_CLOSED = 2;
const GLOBAL_REGISTRY_KEY = Symbol.for("link-loom.cloud-sdk.realtime-connection-registry.v1");

const normalizeBaseUrl = (baseUrl) => String(baseUrl || "").replace(/\/+$/, "");

const withoutChannels = (params = {}) => {
  const { channels, ...rest } = params;
  return rest;
};

const parsePayload = (event) => {
  try {
    return JSON.parse(event.data);
  } catch {
    return event?.data;
  }
};

/**
 * Page-wide pool of Signals SSE connections.
 *
 * Browsers cap HTTP/1.1 connections per host (6 in Chrome, shared by every tab of the profile), so
 * every app runtime, embed, modal and the notifications bridge share connections here instead of
 * opening their own. A connection ("lane") is keyed by base URL + stream params without channels:
 * the backend authorizes `app-data:` channels against ONE `app_session_id` and signal payloads carry
 * no channel, so different app sessions cannot share a connection without mixing their record
 * signals. Shareable clients (`user:` channels) ride on any lane of the same identity.
 *
 * Channel changes are coalesced; a lane whose channel set changed is replaced atomically (the old
 * EventSource is closed and the new one created in the same tick, so both are never open). Lanes
 * close when no client needs them, back off exponentially with jitter on errors and close on
 * `pagehide`. After the page has been hidden for a while the pool shrinks to the identity's `user:`
 * channels (desktop notifications keep flowing) and restores `app-data:` channels when the page is
 * visible again; reopened lanes notify their clients so they catch up (`/app-engine/data/changes`).
 */
export class RealtimeConnectionRegistry {
  constructor({
    EventSourceImpl,
    timers = globalThis,
    documentRef = typeof document !== "undefined" ? document : null,
    windowRef = typeof window !== "undefined" ? window : null,
    coalesceMs = COALESCE_MS,
    hiddenPauseMs = HIDDEN_PAUSE_MS,
    random = Math.random,
    now = () => Date.now(),
  } = {}) {
    this._EventSourceImpl = EventSourceImpl;
    this._timers = timers;
    this._document = documentRef;
    this._window = windowRef;
    this._coalesceMs = coalesceMs;
    this._hiddenPauseMs = hiddenPauseMs;
    this._random = random;
    this._now = now;
    this._clients = new Set();
    this._lanes = new Map();
    this._flushTimer = null;
    this._flushDelay = null;
    this._hiddenTimer = null;
    this._paused = false;
    this._backgrounded = false;
    this._resumed = false;
    this._lifecycleBound = false;
  }

  register(client) {
    this._clients.add(client);
    this.#bindLifecycle();
    this.schedule();
  }

  unregister(client) {
    if (!this._clients.delete(client)) {
      return;
    }
    this.schedule();
  }

  // A lane nobody has opened yet flushes on the next macrotask (StrictMode's mount/unmount/mount still
  // coalesces); changes to open lanes wait for the coalescing window.
  schedule() {
    const delay = this.#hasUnopenedLane() ? 0 : this._coalesceMs;
    if (this._flushTimer && this._flushDelay <= delay) {
      return;
    }
    this._timers.clearTimeout(this._flushTimer);
    this._flushDelay = delay;
    this._flushTimer = this._timers.setTimeout(() => {
      this._flushTimer = null;
      this._flushDelay = null;
      this.reconcile();
    }, delay);
  }

  // Binds newly listened signal names on a live lane without reconnecting.
  refreshSignals(client) {
    for (const lane of this._lanes.values()) {
      if (lane.clients.has(client)) {
        this.#bindSignals(lane);
      }
    }
  }

  isConnected(client) {
    for (const lane of this._lanes.values()) {
      if (lane.clients.has(client) && lane.source?.readyState === 1) {
        return true;
      }
    }
    return false;
  }

  openConnectionCount() {
    return [...this._lanes.values()].filter((lane) => lane.source).length;
  }

  reconcile() {
    this._timers.clearTimeout(this._flushTimer);
    this._flushTimer = null;
    this._flushDelay = null;

    const desired = this._paused ? new Map() : this.#desiredLanes();

    for (const [key, lane] of this._lanes) {
      if (!desired.has(key)) {
        this.#closeLane(lane);
        this._lanes.delete(key);
      }
    }

    const notifyOnOpen = this._resumed;
    this._resumed = false;

    for (const [key, target] of desired) {
      const url = buildSignalStreamUrl(`${target.baseUrl}${STREAM_PATH}`, {
        ...target.params,
        channels: [...target.channels].sort(),
      });
      const lane = this._lanes.get(key);

      if (lane && lane.url === url) {
        lane.clients = target.clients;
        this.#bindSignals(lane);
        continue;
      }

      const nextLane = {
        key,
        url,
        clients: target.clients,
        identityKey: target.identityKey,
        source: null,
        boundSignals: new Set(),
        attempts: 0,
        openedAt: null,
        retryTimer: null,
        notifyOnOpen: Boolean(lane) || notifyOnOpen,
      };
      // Same tick, old socket released first: the per-host connection budget never holds both.
      if (lane) {
        this.#closeLane(lane);
      }
      this._lanes.set(key, nextLane);
      this.#openSource(nextLane);
    }
  }

  #hasUnopenedLane() {
    if (this._paused) {
      return false;
    }
    for (const client of this._clients) {
      if (this.#channelsOf(client).length && ![...this._lanes.values()].some((lane) => lane.clients.has(client))) {
        return true;
      }
    }
    return false;
  }

  #channelsOf(client) {
    const channels = client.channels();
    return this._backgrounded ? channels.filter((channel) => channel.startsWith(BACKGROUND_CHANNEL_PREFIX)) : channels;
  }

  #describe(client) {
    const baseUrl = normalizeBaseUrl(client.baseUrl);
    const params = withoutChannels(client.getParams?.() || {});
    const identityKey = `${baseUrl}|${params.access_token || ""}|${params.organization_id || ""}`;
    const laneKey = `${baseUrl}|${buildSignalStreamUrl("", params)}`;
    return { baseUrl, params, identityKey, laneKey };
  }

  #desiredLanes() {
    const desired = new Map();
    const shareable = [];

    const addTo = (key, description, client) => {
      if (!desired.has(key)) {
        desired.set(key, {
          baseUrl: description.baseUrl,
          params: description.params,
          identityKey: description.identityKey,
          clients: new Set(),
          channels: new Set(),
        });
      }
      const target = desired.get(key);
      target.clients.add(client);
      this.#channelsOf(client).forEach((channel) => target.channels.add(channel));
    };

    for (const client of this._clients) {
      if (!this.#channelsOf(client).length) {
        continue;
      }
      if (client.shareable) {
        shareable.push(client);
        continue;
      }
      const description = this.#describe(client);
      addTo(description.laneKey, description, client);
    }

    for (const client of shareable) {
      const description = this.#describe(client);
      const candidates = [...desired.entries()].filter(([, target]) => target.identityKey === description.identityKey);
      const currentHost = candidates.find(([key]) => this._lanes.get(key)?.clients.has(client));
      const host = currentHost || candidates[0];
      addTo(host ? host[0] : description.laneKey, description, client);
    }

    return desired;
  }

  #openSource(lane) {
    const EventSourceImpl = this._EventSourceImpl || globalThis.EventSource;
    if (!EventSourceImpl) {
      return;
    }

    const source = new EventSourceImpl(lane.url);
    lane.source = source;
    lane.boundSignals = new Set();

    source.onopen = () => {
      if (lane.source !== source) {
        return;
      }
      // A denied channel opens and is closed by the backend right away. Only a lane that stays open
      // counts as a working connection; otherwise the backoff resets and the lane retries every second.
      lane.openedAt = this._now();
      if (lane.notifyOnOpen) {
        lane.clients.forEach((client) => client.notifyReconnect());
      }
      lane.notifyOnOpen = true;
    };

    source.onerror = () => {
      if (lane.source !== source) {
        return;
      }
      // The native EventSource retries on its own at a fixed pace; retries are owned here instead.
      source.close();
      lane.source = null;
      if (lane.openedAt && this._now() - lane.openedAt >= STABLE_CONNECTION_MS) {
        lane.attempts = 0;
      }
      lane.openedAt = null;
      this.#scheduleRetry(lane);
    };

    this.#bindSignals(lane);
  }

  #scheduleRetry(lane) {
    const ceiling = Math.min(BACKOFF_BASE_MS * 2 ** lane.attempts, BACKOFF_MAX_MS);
    const delay = Math.round(ceiling / 2 + (ceiling / 2) * this._random());
    lane.attempts += 1;
    lane.notifyOnOpen = true;
    this._timers.clearTimeout(lane.retryTimer);
    lane.retryTimer = this._timers.setTimeout(() => {
      lane.retryTimer = null;
      if (this._lanes.get(lane.key) !== lane || lane.source || this._paused) {
        return;
      }
      this.#openSource(lane);
    }, delay);
  }

  #bindSignals(lane) {
    const source = lane.source;
    if (!source) {
      return;
    }
    for (const client of lane.clients) {
      for (const signalName of client.signalNames()) {
        if (lane.boundSignals.has(signalName)) {
          continue;
        }
        lane.boundSignals.add(signalName);
        source.addEventListener(signalName, (event) => {
          if (lane.source !== source) {
            return;
          }
          const payload = parsePayload(event);
          lane.clients.forEach((laneClient) => laneClient.dispatch(signalName, payload, event));
        });
      }
    }
  }

  #closeLane(lane) {
    this._timers.clearTimeout(lane.retryTimer);
    lane.retryTimer = null;
    if (lane.source && lane.source.readyState !== EVENT_SOURCE_CLOSED) {
      lane.source.close();
    }
    lane.source = null;
  }

  pause() {
    if (this._paused) {
      return;
    }
    this._paused = true;
    this.reconcile();
  }

  resume() {
    if (!this._paused) {
      return;
    }
    this._paused = false;
    this._resumed = true;
    this.reconcile();
  }

  // Hidden long enough: keep only `user:` channels, on a single lane per identity.
  background() {
    if (this._backgrounded) {
      return;
    }
    this._backgrounded = true;
    this.reconcile();
  }

  foreground() {
    this._timers.clearTimeout(this._hiddenTimer);
    this._hiddenTimer = null;
    if (!this._backgrounded) {
      return;
    }
    this._backgrounded = false;
    this._resumed = true;
    this.reconcile();
  }

  // Lanes waiting on backoff retry right away when the network comes back.
  retryNow() {
    for (const lane of this._lanes.values()) {
      if (lane.source || !lane.retryTimer) {
        continue;
      }
      this._timers.clearTimeout(lane.retryTimer);
      lane.retryTimer = null;
      lane.attempts = 0;
      this.#openSource(lane);
    }
  }

  handleVisibilityChange() {
    if (this._document?.visibilityState !== "hidden" && !this._document?.hidden) {
      this.foreground();
      return;
    }
    if (this._backgrounded || this._hiddenTimer) {
      return;
    }
    this._hiddenTimer = this._timers.setTimeout(() => {
      this._hiddenTimer = null;
      this.background();
    }, this._hiddenPauseMs);
  }

  #bindLifecycle() {
    if (this._lifecycleBound) {
      return;
    }
    this._lifecycleBound = true;
    this._document?.addEventListener?.("visibilitychange", () => this.handleVisibilityChange());
    this._window?.addEventListener?.("pagehide", () => this.pause());
    this._window?.addEventListener?.("pageshow", () => {
      this.resume();
      this.handleVisibilityChange();
    });
    this._window?.addEventListener?.("online", () => this.retryNow());
    // A page loaded in a background tab never fires `visibilitychange` until it is shown.
    this.handleVisibilityChange();
  }
}

export const getRealtimeConnectionRegistry = () => {
  if (!globalThis[GLOBAL_REGISTRY_KEY]) {
    globalThis[GLOBAL_REGISTRY_KEY] = new RealtimeConnectionRegistry();
  }
  return globalThis[GLOBAL_REGISTRY_KEY];
};

import { io } from "socket.io-client";

/**
 * EventBusConsumer — durable, at-least-once consumer for a Link Loom Cloud Event Bus topic.
 *
 * Wraps `socket.io-client` for the live tail and plain `fetch` for the durable operations (catch-up,
 * commit, dead-letter), so it runs unchanged in Node (service-to-service) and in the browser.
 *
 * What it guarantees:
 *  - **Nothing is missed while offline.** On connect (and on every reconnect) it catches up from the
 *    group's committed offset before tailing live.
 *  - **Ordered, one at a time.** Messages drain sequentially by (partition, offset); a message that
 *    arrives live while catch-up is running is queued, not raced.
 *  - **At-least-once.** A message is only committed once the handler succeeds. Handlers must be idempotent.
 *  - **Bounded retry, then dead-letter.** A failing handler is retried `maxAttempts` times with backoff;
 *    when the budget is exhausted the message is dead-lettered and the offset advances so the partition
 *    keeps moving.
 *
 * Usage:
 *   const consumer = new EventBusConsumer({ baseUrl, apiKey, topic: "billing", group: "invoicing-worker" });
 *
 *   await consumer.run(async ({ payload, ack, nack }) => {
 *     await handle(payload.values);
 *     await ack();
 *   });
 *
 * With `autoCommit` (default true) a handler that simply resolves is committed, and one that throws is
 * retried — so the minimal consumer is `consumer.run(async ({ payload }) => handle(payload))`.
 */
export default class EventBusConsumer {
  constructor(args) {
    this._baseUrl = (args?.baseUrl || "").replace(/\/$/, "");
    this._apiKey = args?.apiKey || "";
    this._topic = args?.topic || "";
    this._group = args?.group || "";
    this._organizationId = args?.organizationId || null;
    this._client = args?.client || null;

    this._autoCommit = args?.autoCommit !== false;
    this._maxAttempts = Number(args?.maxAttempts) || 5;
    this._backoffMs = Number(args?.backoffMs) || 1000;
    this._timeoutMs = Number(args?.timeoutMs) || 31000;

    this._pageSize = Number(args?.pageSize) || 500;

    this._socket = null;
    this._handler = null;
    this._closed = false;
    this._draining = false;
    // While catch-up is in flight the live tail is queued but NOT drained: a live frame at a higher offset
    // must never be handled (and committed) ahead of the backlog it would then skip past.
    this._catchingUp = false;

    this._partitions = [];
    this._queue = [];
    this._queued = new Set(); // "partition:offset" — de-dupes catch-up against the live tail
    this._processed = new Map(); // partition -> next offset expected (mirrors the committed offset)

    this._onError = args?.onError || null;
    this._onDeadLetter = args?.onDeadLetter || null;
    this._onAssigned = args?.onAssigned || null;
  }

  /** Partitions currently assigned to this member by the broker. */
  get partitions() {
    return [...this._partitions];
  }

  /** True once the socket is connected. */
  get connected() {
    return !!this._socket?.connected;
  }

  /**
   * Start consuming. Resolves once the consumer is connected and assigned; keeps running until
   * `disconnect()` is called.
   *
   * @param {Function} handler - `({ payload, message, ack, nack, attempt }) => any`
   */
  async run(handler) {
    if (typeof handler !== "function") {
      throw new Error("EventBusConsumer.run requires a handler function");
    }

    if (!this._topic || !this._group) {
      throw new Error("EventBusConsumer requires a topic and a group");
    }

    this._handler = handler;
    this._closed = false;

    return new Promise((resolve, reject) => {
      this._socket = io(this._baseUrl, {
        transports: ["websocket"],
        auth: {
          api_key: this._apiKey,
          topic: this._topic,
          group: this._group,
          organization_id: this._organizationId,
          client: this._client,
        },
      });

      let settled = false;

      this._socket.on("event-bus::ready", (payload) => {
        this.#applyAssignment(payload?.partitions, payload?.offsets);
        this.#catchUp();

        if (!settled) {
          settled = true;
          resolve(this);
        }
      });

      this._socket.on("event-bus::assigned", (payload) => {
        this.#applyAssignment(payload?.partitions);
        this.#catchUp();
      });

      this._socket.on("event-bus::message", (message) => {
        this.#enqueue(message);
        this.#drain();
      });

      this._socket.on("event-bus::error", (payload) => {
        const error = new Error(payload?.message || "Event Bus error");
        this.#reportError(error);

        if (!settled) {
          settled = true;
          reject(error);
        }
      });

      this._socket.on("connect_error", (error) => {
        this.#reportError(error);
      });
    });
  }

  /** Stop consuming and close the socket. */
  disconnect() {
    this._closed = true;
    this._queue = [];
    this._queued.clear();

    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
  }

  #applyAssignment(partitions, offsets) {
    const assigned = Array.isArray(partitions) ? partitions.map(Number) : [];
    this._partitions = assigned;

    // A seek can move a group's committed offset backwards; honour it by replaying from there.
    if (offsets && typeof offsets === "object") {
      for (const partition of assigned) {
        const committed = Number(offsets[partition]) || 0;
        const known = this._processed.get(partition);

        if (known === undefined || committed < known) {
          this._processed.set(partition, committed);
        }
      }
    }

    // Drop anything queued for a partition this member no longer owns — another member has it now.
    this._queue = this._queue.filter((message) => {
      const keep = assigned.includes(Number(message.partition));

      if (!keep) {
        this._queued.delete(this.#key(message));
      }

      return keep;
    });

    if (typeof this._onAssigned === "function") {
      try {
        this._onAssigned(this.partitions);
      } catch (error) {
        this.#reportError(error);
      }
    }
  }

  /**
   * Drain the backlog before tailing live.
   *
   * Each partition is paged to exhaustion using an explicit READ CURSOR (`from_offset`), which is
   * independent of the committed offset — so paging never depends on having acknowledged the previous
   * page. Nothing is handed to the handler until every page is buffered: a live frame that arrives
   * meanwhile is queued and sorts behind the backlog, which is what makes delivery strictly ordered and
   * makes it impossible for a live message to be committed ahead of (and thereby skip) the backlog.
   */
  async #catchUp() {
    if (this._closed || this._catchingUp) {
      return;
    }

    this._catchingUp = true;

    try {
      for (const partition of this._partitions) {
        let cursor = this._processed.get(partition);
        let guard = 0;

        // Bounded so a server that keeps reporting has_more can never spin forever.
        while (!this._closed && guard < 1000) {
          guard += 1;

          const response = await this.#get("/communication/event-bus/catch-up", {
            topic: this._topic,
            group: this._group,
            partition,
            from_offset: cursor,
            pageSize: this._pageSize,
          });

          const items = response?.result?.items || [];

          if (!items.length) {
            break;
          }

          for (const message of items) {
            this.#enqueue(message);
          }

          cursor = Number(items[items.length - 1].offset) + 1;

          if (!response?.result?.has_more) {
            break;
          }
        }
      }
    } finally {
      this._catchingUp = false;
    }

    await this.#drain();
  }

  #enqueue(message) {
    if (this._closed || !message || message.topic !== this._topic) {
      return;
    }

    const partition = Number(message.partition) || 0;

    if (!this._partitions.includes(partition)) {
      return;
    }

    const offset = Number(message.offset);
    const expected = this._processed.get(partition);

    // Already handled in this session (live frame + catch-up can overlap).
    if (expected !== undefined && offset < expected) {
      return;
    }

    const key = this.#key(message);

    if (this._queued.has(key)) {
      return;
    }

    this._queued.add(key);
    this._queue.push(message);
  }

  async #drain() {
    if (this._draining || this._closed || this._catchingUp) {
      return;
    }

    this._draining = true;

    try {
      while (this._queue.length && !this._closed) {
        this._queue.sort(
          (a, b) => a.partition - b.partition || a.offset - b.offset,
        );

        const message = this._queue.shift();
        this._queued.delete(this.#key(message));

        await this.#deliver(message);
      }
    } finally {
      this._draining = false;
    }
  }

  async #deliver(message) {
    const partition = Number(message.partition) || 0;
    const offset = Number(message.offset);
    let lastError = null;

    for (let attempt = 1; attempt <= this._maxAttempts; attempt += 1) {
      if (this._closed) {
        return;
      }

      const outcome = { settled: false, acked: false, error: null };

      const ack = async () => {
        outcome.settled = true;
        outcome.acked = true;
      };

      const nack = async (error) => {
        outcome.settled = true;
        outcome.acked = false;
        outcome.error = error || new Error("Handler nacked the message");
      };

      try {
        await this._handler({
          payload: message.envelope,
          message,
          ack,
          nack,
          attempt,
        });

        // With autoCommit, a handler that resolves without an explicit outcome is treated as an ack.
        if (!outcome.settled && this._autoCommit) {
          outcome.settled = true;
          outcome.acked = true;
        }
      } catch (error) {
        outcome.settled = true;
        outcome.acked = false;
        outcome.error = error;
      }

      if (outcome.acked) {
        this._processed.set(partition, offset + 1);
        await this.#commit(partition, offset);
        return;
      }

      lastError = outcome.error || lastError;
      this.#reportError(lastError);

      if (attempt < this._maxAttempts) {
        await this.#sleep(this._backoffMs * attempt);
      }
    }

    this._processed.set(partition, offset + 1);
    await this.#deadLetter(message, lastError);
  }

  async #commit(partition, offset) {
    return this.#post("/communication/event-bus/commit", {
      topic: this._topic,
      group: this._group,
      partition,
      offset,
    });
  }

  async #deadLetter(message, error) {
    const response = await this.#post("/communication/event-bus/nack", {
      topic: this._topic,
      group: this._group,
      partition: message.partition,
      offset: message.offset,
      message_id: message.id,
      envelope: message.envelope,
      attempts: this._maxAttempts,
      error: error?.message || String(error || "unknown error"),
    });

    if (typeof this._onDeadLetter === "function") {
      try {
        this._onDeadLetter(message, error);
      } catch (callbackError) {
        this.#reportError(callbackError);
      }
    }

    return response;
  }

  #reportError(error) {
    if (typeof this._onError === "function") {
      try {
        this._onError(error);
        return;
      } catch {
        /* fall through to the console */
      }
    }

    console.error(error);
  }

  #key(message) {
    return `${message.partition}:${message.offset}`;
  }

  #sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  #headers() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this._apiKey ? { "api-key": this._apiKey } : {}),
    };
  }

  async #get(endpoint, params) {
    const query = Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join("&");

    try {
      const response = await fetch(
        `${this._baseUrl}${endpoint}${query ? `?${query}` : ""}`,
        { headers: this.#headers() },
      );
      return await response.json();
    } catch (error) {
      this.#reportError(error);
      return null;
    }
  }

  async #post(endpoint, body) {
    try {
      const response = await fetch(`${this._baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.#headers(),
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (error) {
      this.#reportError(error);
      return null;
    }
  }
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { RECORD_SEARCH_STATUSES, createRecordSearchRunner } from "../src/features/app-engine/search/app-search.runner.js";

const flush = () => new Promise((resolve) => setImmediate(resolve));

const setup = ({ answer = async ({ text }) => ({ items: [{ id: text }] }) } = {}) => {
  const states = [];
  const requests = [];
  const timers = [];
  const client = {
    searchRecords: (request) => {
      requests.push(request);
      return answer(request);
    },
  };
  const runner = createRecordSearchRunner({
    client,
    limit: 5,
    debounceMs: 300,
    onChange: (state) => states.push(state),
    setTimer: (callback, delay) => timers.push({ callback, delay, cleared: false }) - 1,
    clearTimer: (id) => {
      if (timers[id]) {
        timers[id].cleared = true;
      }
    },
  });
  const fire = async (id = timers.length - 1) => {
    if (!timers[id].cleared) {
      timers[id].callback();
    }
    await flush();
  };

  return { runner, states, requests, timers, fire };
};

describe("record search runner", () => {
  it("waits for a pause in typing before it searches", async () => {
    const { runner, states, requests, timers, fire } = setup();

    runner.update("acme");

    assert.equal(requests.length, 0);
    assert.equal(timers[0].delay, 300);
    assert.deepEqual(states, [{ status: RECORD_SEARCH_STATUSES.loading, hits: [] }]);

    await fire();

    assert.equal(requests.length, 1);
    assert.equal(requests[0].text, "acme");
    assert.equal(requests[0].limit, 5);
    assert.deepEqual(states.at(-1), { status: RECORD_SEARCH_STATUSES.ready, hits: [{ id: "acme" }] });
  });

  it("searches only the latest text: the earlier timer is cancelled", async () => {
    const { runner, requests, timers, fire } = setup();

    runner.update("ac");
    runner.update("acme");

    assert.equal(timers[0].cleared, true);

    await fire(0);
    await fire(1);

    assert.deepEqual(
      requests.map((request) => request.text),
      ["acme"],
    );
  });

  it("lets only the latest search answer, aborting the one it replaced", async () => {
    const resolvers = [];
    const { runner, states, requests, fire } = setup({
      answer: ({ text }) => new Promise((resolve) => resolvers.push(() => resolve({ items: [{ id: text }] }))),
    });

    runner.update("acme");
    await fire(0);
    runner.update("acme corp");

    assert.equal(requests[0].signal.aborted, true);

    await fire(1);
    resolvers[1]();
    await flush();
    resolvers[0]();
    await flush();

    assert.deepEqual(states.at(-1), { status: RECORD_SEARCH_STATUSES.ready, hits: [{ id: "acme corp" }] });
    assert.equal(states.filter((state) => state.status === RECORD_SEARCH_STATUSES.ready).length, 1);
  });

  it("goes back to idle, without asking, when the text is too short or empty", async () => {
    const { runner, states, requests, timers } = setup();

    for (const text of ["", " ", "a", undefined]) {
      runner.update(text);
    }

    assert.equal(requests.length, 0);
    assert.equal(timers.length, 0);
    assert.ok(states.every((state) => state.status === RECORD_SEARCH_STATUSES.idle && state.hits.length === 0));
  });

  it("clears the results when the person deletes the text", async () => {
    const { runner, states, fire } = setup();

    runner.update("acme");
    await fire();
    runner.update("");

    assert.deepEqual(states.at(-1), { status: RECORD_SEARCH_STATUSES.idle, hits: [] });
  });

  it("reports an error when the search fails, but not when it was cancelled", async () => {
    const failing = setup({
      answer: async () => {
        throw new Error("offline");
      },
    });

    failing.runner.update("acme");
    await failing.fire();

    assert.deepEqual(failing.states.at(-1), { status: RECORD_SEARCH_STATUSES.error, hits: [] });

    const cancelled = setup({
      answer: async () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      },
    });

    cancelled.runner.update("acme");
    await cancelled.fire();

    assert.equal(cancelled.states.at(-1).status, RECORD_SEARCH_STATUSES.loading);
  });

  it("stops everything when the screen goes away", async () => {
    const { runner, states, timers, fire } = setup();

    runner.update("acme");
    runner.dispose();
    await fire();

    assert.equal(timers[0].cleared, true);
    assert.equal(states.at(-1).status, RECORD_SEARCH_STATUSES.loading);
  });
});

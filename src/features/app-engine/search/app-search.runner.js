import { APP_SEARCH_MIN_LENGTH } from "./app-search.client";

export const RECORD_SEARCH_STATUSES = { idle: "idle", loading: "loading", ready: "ready", error: "error" };

/**
 * The search of a text that keeps changing, as a screen needs it: it waits for a pause in typing,
 * never searches text that is too short to find anything, cancels the search a newer text makes
 * obsolete and lets only the latest one answer. `onChange` receives `{ status, hits }` each time
 * the state changes; `update(text)` is called on every keystroke and `dispose()` when the screen
 * goes away.
 */
export const createRecordSearchRunner = ({
  client,
  limit,
  debounceMs = 300,
  onChange,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) => {
  let timer = null;
  let controller = null;
  let run = 0;

  const stop = () => {
    clearTimer(timer);
    controller?.abort();
    controller = null;
    run += 1;
  };

  const search = async ({ text, current }) => {
    controller = new AbortController();

    try {
      const { items } = await client.searchRecords({ text, limit, signal: controller.signal });

      if (current === run) {
        onChange({ status: RECORD_SEARCH_STATUSES.ready, hits: items });
      }
    } catch (error) {
      if (current === run && error?.name !== "AbortError") {
        onChange({ status: RECORD_SEARCH_STATUSES.error, hits: [] });
      }
    }
  };

  return {
    update(text) {
      stop();

      const trimmed = String(text || "").trim();

      if (trimmed.length < APP_SEARCH_MIN_LENGTH) {
        onChange({ status: RECORD_SEARCH_STATUSES.idle, hits: [] });
        return;
      }

      const current = run;

      onChange({ status: RECORD_SEARCH_STATUSES.loading, hits: [] });
      timer = setTimer(() => search({ text: trimmed, current }), debounceMs);
    },
    dispose: stop,
  };
};

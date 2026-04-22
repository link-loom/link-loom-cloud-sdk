/**
 * Reliable dispatcher for Command Center app-embed records.
 *
 * Why this exists: `sommatic:app:create-embed-from-escalation` is listened
 * inside `CognitiveEntryManager`, which is mounted only when the Command
 * Center sidebar is open. If the sidebar is closed when we want to inject an
 * embed, opening it via `setIsOpen(true)` and firing the event on the next
 * macrotask is a race — React's passive effects (where the listener installs)
 * may not have run yet.
 *
 * The sidebar dispatches `sommatic:command-center-opened` from a PARENT
 * useEffect after `isOpen` becomes true. By React's bottom-up effect order,
 * child effects (including CognitiveEntryManager's listener install) have
 * already run when that event fires. We key off that signal for correctness.
 *
 * A module-level flag tracks the sidebar state so repeat calls while already
 * open dispatch immediately without the round trip.
 */

const OPEN_EVENT = 'sommatic:command-center-opened';
const CLOSED_EVENT = 'sommatic:command-center-closed';
const OPEN_COMMAND_CENTER_EVENT = 'sommatic:open-command-center';
const CREATE_EMBED_EVENT = 'sommatic:app:create-embed-from-escalation';

const LOG_PREFIX = '[CC-CHAIN]';
const now = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return `+${performance.now().toFixed(1)}ms`;
  }
  return new Date().toISOString();
};

let isCommandCenterOpen = false;
let listenersInstalled = false;

function ensureStateListeners() {
  if (listenersInstalled) return;
  if (typeof window === 'undefined') return;

  window.addEventListener(OPEN_EVENT, () => {
    isCommandCenterOpen = true;
    console.log(`${LOG_PREFIX} ${now()} sidebar opened → isCommandCenterOpen=true`);
  });
  window.addEventListener(CLOSED_EVENT, () => {
    isCommandCenterOpen = false;
    console.log(`${LOG_PREFIX} ${now()} sidebar closed → isCommandCenterOpen=false`);
  });
  listenersInstalled = true;
  console.log(`${LOG_PREFIX} ${now()} module state listeners installed`);
}

/**
 * Open the Command Center sidebar (if closed) and dispatch an embed record.
 *
 * `detail` shape matches `sommatic:app:create-embed-from-escalation`:
 *   { appSlug, routePath, inputPayload, parentSessionId, viewState }
 *
 * Options:
 *   - `fallbackDelayMs` (default 500): if the `command-center-opened` signal
 *     never arrives, fire the create event anyway after this delay as a
 *     safety net.
 */
function fireCreateEmbed(detail, reason) {
  console.log(`${LOG_PREFIX} ${now()} dispatching ${CREATE_EMBED_EVENT} (reason=${reason})`, detail);
  window.dispatchEvent(new CustomEvent(CREATE_EMBED_EVENT, { detail }));
}

export function dispatchEmbedToCommandCenter(detail, { fallbackDelayMs = 500 } = {}) {
  console.log(`${LOG_PREFIX} ${now()} dispatchEmbedToCommandCenter() called`, detail);

  if (typeof window === 'undefined') {
    console.warn(`${LOG_PREFIX} ${now()} aborted: no window`);
    return;
  }
  if (!detail?.appSlug) {
    console.warn(`${LOG_PREFIX} ${now()} aborted: no detail.appSlug`, detail);
    return;
  }

  ensureStateListeners();

  console.log(`${LOG_PREFIX} ${now()} state check → isCommandCenterOpen=${isCommandCenterOpen}`);

  if (isCommandCenterOpen) {
    fireCreateEmbed(detail, 'sidebar-already-open');
    return;
  }

  let resolved = false;

  const fire = (reason) => {
    if (resolved) {
      console.log(`${LOG_PREFIX} ${now()} fire() suppressed (already resolved, reason=${reason})`);
      return;
    }
    resolved = true;
    window.removeEventListener(OPEN_EVENT, onOpened);
    clearTimeout(fallbackTimer);
    console.log(`${LOG_PREFIX} ${now()} fire() running (reason=${reason}) → scheduling deferred dispatch`);

    const schedule =
      typeof window.requestAnimationFrame === 'function'
        ? (fn) => window.requestAnimationFrame(fn)
        : (fn) => setTimeout(fn, 16);

    schedule(() => {
      console.log(`${LOG_PREFIX} ${now()} rAF fired, queueing macrotask`);
      setTimeout(() => {
        console.log(`${LOG_PREFIX} ${now()} macrotask fired, dispatching create-embed now`);
        fireCreateEmbed(detail, `via-${reason}`);
      }, 0);
    });
  };

  const onOpened = () => {
    console.log(`${LOG_PREFIX} ${now()} received ${OPEN_EVENT} → calling fire()`);
    fire('opened-event');
  };
  window.addEventListener(OPEN_EVENT, onOpened);
  const fallbackTimer = setTimeout(() => {
    console.warn(`${LOG_PREFIX} ${now()} fallback timer (${fallbackDelayMs}ms) elapsed → firing anyway`);
    fire('fallback-timer');
  }, fallbackDelayMs);

  console.log(`${LOG_PREFIX} ${now()} dispatching ${OPEN_COMMAND_CENTER_EVENT} to open sidebar`);
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_CENTER_EVENT, { detail: {} }));
}

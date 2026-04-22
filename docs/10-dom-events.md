# DOM Event Bus

## 1. Overview

The App Engine runtime coordinates three independent surfaces — the webapp host, the compiled app embeds, and the SDK itself — that must remain loosely coupled. The host cannot import app code (apps are compiled at runtime from blob URLs) and apps cannot import the host (they see only the `sdk` object). Where a direct function call would create a cycle, the SDK uses the browser's `window` event bus as a late-bound coordination channel.

All events are namespaced under `sommatic:*`. Every event is a `CustomEvent` whose `detail` field carries the contract. This document describes the events the SDK cloud **dispatches** and **listens to**, plus the peripheral events it only observes so that integrators understand the full picture.

| Audience | Needs this doc when... |
|----------|------------------------|
| SDK consumers | Wiring a new host or extending an existing one |
| App developers | Writing an `AppHeader` or replacing `sdk.requestEscalation(...)` with a DOM event |
| Platform operators | Debugging flows where a command/chain runs but the UI does not update |

## 2. Namespace Convention

| Prefix | Semantics |
|--------|-----------|
| `sommatic:command-center-*` | Lifecycle of the Command Center sidebar (opened/closed signals) |
| `sommatic:open-command-center` | Intent to open the sidebar — optionally with an `appEmbed` to show inside |
| `sommatic:app:*` | Anything tied to the lifecycle of a single app embed (output, escalation, route sync) |

Within `sommatic:app:*` the suffix indicates the actor and the direction:

| Suffix | Actor | Direction |
|--------|-------|-----------|
| `request-*` | App | App → Host |
| `create-*` / `embed-*` | Host / SDK | Host → CognitiveEntryManager |
| `fullscreen-*` | Host page (in fullscreen mode) | Host page → Host layout |
| `output` | App | App → SDK/Host |

## 3. Event Catalog

Full list of events the SDK cloud code touches directly:

| Event | `detail` shape | Emitter | Listener in SDK cloud |
|-------|----------------|---------|-----------------------|
| `sommatic:open-command-center` | `{ appEmbed?, conversationId?, initialMessage? }` | SDK (chain hook + embed dispatcher) and host webapp | `@sommatic/react-sdk` `CommandCenterSidebar` (not here) |
| `sommatic:app:create-embed-from-escalation` | `{ appSlug, routePath, inputPayload, parentSessionId?, viewState? }` | SDK (`dispatchEmbedToCommandCenter`) | `@sommatic/react-sdk` `CognitiveEntryManager` (not here) |
| `sommatic:command-center-opened` | `{}` | `@sommatic/react-sdk` `CommandCenterSidebar` | `command-center-dispatch.js` |
| `sommatic:command-center-closed` | `{}` | `@sommatic/react-sdk` `CommandCenterSidebar` | `command-center-dispatch.js` |
| `sommatic:app:request-escalation` | `{ sessionId, targetMode }` | App (via `AppHeader`) | `AppRuntimeHost.component.jsx` |
| `sommatic:app:request-de-escalation` | `{ sessionId }` | App (via `AppHeader`) | `AppRuntimeHost.component.jsx` |
| `sommatic:app:output` | `{ appSlug, outputPayload }` (optional `recordId`) | Host (`LayoutBusiness`, fullscreen page) | `useAppEngineChainContributions.hook.js` |

Events referenced for context but not handled by the SDK cloud itself are listed in section 6.

## 4. Events Dispatched by the SDK

### 4.1 `sommatic:open-command-center`

Tells the sidebar component to open (and optionally to route an `appEmbed` through its own forwarding pipeline for `modal` / `fullscreen` modes).

**Shape**

```javascript
{
  appEmbed?: {
    app_slug: string,
    route_path?: string,
    input_payload?: object,
    launch_mode?: 'command-center' | 'modal' | 'fullscreen',
  },
  conversationId?: string,
  initialMessage?: string,
}
```

**Emitted from**

- `src/features/app-contributions/command-center-dispatch.js` — with empty `detail` to force the sidebar open before injecting an embed record.
- `src/features/app-contributions/useAppEngineChainContributions.hook.js` — with the full `appEmbed` descriptor when a chain targets `modal` / `fullscreen` and the webapp host is expected to take over.

**Example dispatch**

```javascript
window.dispatchEvent(
  new CustomEvent('sommatic:open-command-center', {
    detail: { appEmbed: { app_slug: 'liquidaciones-ai', route_path: '/new-sentence', launch_mode: 'modal' } },
  }),
);
```

**Consumer**

`@sommatic/react-sdk` `CommandCenterSidebar` listens globally and either opens the sidebar or forwards the embed to the conversation manager.

---

### 4.2 `sommatic:app:create-embed-from-escalation`

Injects an app-embed record into the currently active conversation.

**Shape**

```javascript
{
  appSlug: string,
  routePath: string,
  inputPayload: object,
  parentSessionId?: string | null,
  viewState?: object | null,
}
```

**Emitted from**

`src/features/app-contributions/command-center-dispatch.js` — emitted once the sidebar reports itself as open (or immediately when it already was). The dispatch is deferred past a `requestAnimationFrame` + `setTimeout(0)` so that React has committed the sidebar mount and `CognitiveEntryManager` has installed its listener before the event fires.

**Consumer**

`@sommatic/react-sdk` `CognitiveEntryManager.component.jsx` listens for this event, builds an embed record, appends it to `records`, and caches it in an internal map keyed by `conversationId || '__no_conversation__'` (with a `__pending__` bucket for fetches that are still in flight).

**When to use directly vs. use the helper**

Prefer the helper `dispatchEmbedToCommandCenter(detail)` (exported from `@link-loom/cloud-sdk`) instead of dispatching this event raw. The helper handles the two code paths — sidebar already open vs. sidebar closed — transparently, and prevents the race where the listener is not yet mounted.

## 5. Events Listened by the SDK

### 5.1 `sommatic:command-center-opened` / `sommatic:command-center-closed`

Signals dispatched by `@sommatic/react-sdk`'s `CommandCenterSidebar` whenever its internal `isOpen` state transitions.

**Shape**: `{}` (no detail payload).

**Listener in SDK cloud**

`src/features/app-contributions/command-center-dispatch.js` maintains a module-level flag `isCommandCenterOpen` that mirrors the sidebar state. The flag lets `dispatchEmbedToCommandCenter(...)` take the fast path (dispatch the embed event immediately) when the sidebar is already open, and the slower "open-then-wait" path when it is not.

```javascript
window.addEventListener('sommatic:command-center-opened', () => {
  isCommandCenterOpen = true;
});
window.addEventListener('sommatic:command-center-closed', () => {
  isCommandCenterOpen = false;
});
```

Because these events come from a parent `useEffect`, React guarantees — by bottom-up effect ordering — that all child effects of the newly mounted `CognitiveEntryManager` have already run by the time `command-center-opened` fires. The SDK relies on that ordering to know the embed listener is live.

---

### 5.2 `sommatic:app:request-escalation`

Raised when the user clicks *Open in window* or *Fullscreen* in an app's `AppHeader`. A DOM event is used instead of a direct `sdk.requestEscalation(...)` call so that apps that cannot reach the `sdk` object (generic components) still have a way to request escalation.

**Shape**

```javascript
{
  sessionId: string,
  targetMode: 'modal' | 'fullscreen',
}
```

**Listener in SDK cloud**

`src/components/app-engine/runtime/AppRuntimeHost.component.jsx` installs a listener when `session?.id` becomes available and filters by `sessionId === session.id` so that multiple runtime hosts mounted on the same page (modal + sidebar embed, for instance) do not cross-fire.

```javascript
window.addEventListener('sommatic:app:request-escalation', handleEscalation);
```

The handler captures the current `viewState` via the app-provided `stateProvider`, persists it (`appSessionService.saveViewState`), and calls `onRequestEscalation({ sessionId, targetMode, viewState, routePath })`.

**Emitter example**

```javascript
// App's AppHeader.component.jsx
const handleEscalate = (targetMode) => {
  window.dispatchEvent(
    new CustomEvent('sommatic:app:request-escalation', {
      detail: { sessionId: sdk?.session?.id, targetMode },
    }),
  );
};
```

**Relationship with the `sdk` API**

The app can also call `sdk.requestEscalation(targetMode)` directly — the method internally runs the same capture + callback flow without going through the DOM bus. The DOM event is the portable fallback when `sdk` is not in scope.

---

### 5.3 `sommatic:app:request-de-escalation`

Raised when the user in modal/fullscreen clicks *Back to Command Center*. Mirror of `request-escalation` in the opposite direction.

**Shape**

```javascript
{
  sessionId: string,
}
```

**Listener in SDK cloud**

Same file (`AppRuntimeHost.component.jsx`), same session-id filtering. Captures `viewState`, persists it, invokes `onRequestDeEscalation({ sessionId, viewState, routePath })`.

**Relationship with the `sdk` API**

`sdk.requestDeEscalation()` is the direct method. The DOM event exists so that header components shared across apps can request de-escalation without a hard dependency on the sdk object.

---

### 5.4 `sommatic:app:output`

Emitted by the webapp host whenever an app submits output (`sdk.submitOutput(payload)`).

**Shape**

```javascript
{
  appSlug: string,
  outputPayload: object,
  recordId?: string,
}
```

**Listener in SDK cloud**

`src/features/app-contributions/useAppEngineChainContributions.hook.js` installs a single global listener on mount. For each event it matches active chains by `chain.source_app_slug === detail.appSlug`, compiles an `appEmbed` descriptor with `compileChainAppEmbed(chain, outputPayload)`, and either:

- Calls `dispatchEmbedToCommandCenter(...)` when `launch_mode === 'command-center'`.
- Re-dispatches `sommatic:open-command-center` with the full `{ appEmbed }` otherwise (the host handles modal/fullscreen).

**Emitter examples**

```javascript
// From LayoutBusiness's handleAppOutput
window.dispatchEvent(
  new CustomEvent('sommatic:app:output', {
    detail: { recordId, appSlug, outputPayload: payload },
  }),
);

// From AppEngineRuntime.component.jsx (fullscreen)
window.dispatchEvent(
  new CustomEvent('sommatic:app:output', {
    detail: { appSlug, outputPayload: payload },
  }),
);
```

## 6. Events Observed but Not Handled by the SDK

These events belong to the host webapp or `@sommatic/react-sdk`. The SDK cloud does not emit or listen to them, but understanding them helps when tracing end-to-end flows.

| Event | Direction | Purpose |
|-------|-----------|---------|
| `sommatic:app:embed-escalated` | Host → CEM | Mark a conversation record as `status: 'escalated'` after the host escalates an embed to modal/fullscreen |
| `sommatic:app:escalation-closed` | Host → CEM | Indicate that a modal/fullscreen session closed, letting CEM restore the embed card |
| `sommatic:app:fullscreen-route-change` | Fullscreen page → Layout | Mirror the current internal route while the app is in fullscreen mode |
| `sommatic:app:fullscreen-return-to-chat` | Fullscreen page → Layout | Return-to-command-center intent from a fullscreen route |

## 7. End-to-End Flows

### 7.1 Escalation / De-escalation

```
[App embed] ──click "Fullscreen" in AppHeader──▶
  window.dispatchEvent('sommatic:app:request-escalation',
    { sessionId, targetMode: 'fullscreen' })
                                    │
                                    ▼
            [AppRuntimeHost listener in SDK]
            filters by session?.id
                                    │
                                    ▼
            captures viewState via stateProvider
                                    │
                                    ▼
            invokes onRequestEscalation() callback
                                    │
                                    ▼
        [Webapp LayoutBusiness setEscalatedApp or navigate]
```

The de-escalation flow is symmetric: `sommatic:app:request-de-escalation` → same SDK listener → `onRequestDeEscalation` callback → host shows the embed back in the sidebar.

### 7.2 Chain Output → Open Target App (Sidebar Closed)

```
[sommatic-tabular-workbench]                         [Webapp host]
        │                                                    │
        │ sdk.submitOutput(payload)                          │
        ▼                                                    │
 [sommatic:app:output]  ──────────────────────────────────▶  │
                                                             │
                         [useAppEngineChainContributions hook]
                                       │
                                       │ compileChainAppEmbed(chain, payload)
                                       │ launch_mode === 'command-center'
                                       ▼
                         [dispatchEmbedToCommandCenter(detail)]
                                       │
                             ┌─────────┴─────────┐
                             │                   │
                 isCommandCenterOpen=false      else
                             │                   │
                             ▼                   ▼
  [sommatic:open-command-center]   [sommatic:app:create-embed-from-escalation]
                             │
                             ▼
             [CommandCenterSidebar setIsOpen(true)]
                             │
                             ▼
              [sommatic:command-center-opened]
                             │
                             ▼
                 rAF + setTimeout(0) defer
                             │
                             ▼
      [sommatic:app:create-embed-from-escalation]
                             │
                             ▼
   [CognitiveEntryManager appends embed to active conversation]
```

## 8. Guidance

- **Always prefer `dispatchEmbedToCommandCenter(detail)` over raw events** when injecting an app embed into the sidebar. It handles sidebar-open state, mount timing, and the pending-bucket merge during async conversation fetch.
- **Always prefer `sdk.requestEscalation(targetMode)` / `sdk.requestDeEscalation()` when the `sdk` object is in scope.** The DOM events are the fallback for code that cannot reach the sdk object (typically shared `AppHeader` components).
- **Filter by `sessionId`** when listening to `sommatic:app:request-*` events, or the host will react to events from other runtime instances on the same page.
- **Do not invent new `sommatic:*` events inline.** If a new coordination signal is needed, document it here in the same shape-and-listener format and reference the source file + line.

## 9. Source References

- `src/components/app-engine/runtime/AppRuntimeHost.component.jsx` — listener for `sommatic:app:request-escalation` and `sommatic:app:request-de-escalation`.
- `src/features/app-contributions/command-center-dispatch.js` — `dispatchEmbedToCommandCenter` helper; listeners for `sommatic:command-center-opened` / `sommatic:command-center-closed`; dispatcher for `sommatic:open-command-center` and `sommatic:app:create-embed-from-escalation`.
- `src/features/app-contributions/useAppEngineChainContributions.hook.js` — listener for `sommatic:app:output`; dispatcher for `sommatic:open-command-center`.
- See `05-sdk-contract.md` for the corresponding `sdk.requestEscalation`, `sdk.requestDeEscalation`, and `sdk.submitOutput` methods.

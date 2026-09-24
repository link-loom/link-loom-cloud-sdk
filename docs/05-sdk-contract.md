# App Engine — SDK Contract (App Developer Reference)

## Overview

Every app receives an `sdk` object as its only prop. This object provides session information, input data, API access, navigation, and lifecycle methods.

```javascript
export default function MyApp({ sdk }) {
  const { session, input, context, api, navigate, close } = sdk;
  // ...
}
```

## `sdk.session`

Session metadata for the current execution.

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique session ID |
| `appId` | string | App definition ID |
| `appSlug` | string | App slug (e.g., `sommatic-mission-control`) |
| `appVersionId` | string | Active version ID that's running |
| `launchMode` | string | How the app was launched: `fullscreen`, `launcher`, `task`, `workflow`, `embedded` |
| `routePath` | string | Current route path (e.g., `/`, `/execution/:id`) |

## `sdk.input`

Input payload provided when the app was launched. Shape depends on the launch context:

- **Standalone launch:** Usually `null` or empty object
- **Task context:** `{ task: { id, assignment, priority, ... }, data: { ... } }`
- **Workflow context:** `{ workflowInstanceId, nodeId, payload: { ... } }`
- **Embedded:** Whatever the host passes as `inputPayload`

## `sdk.context`

Execution context with full metadata.

| Property | Type | Description |
|----------|------|-------------|
| `appDefinition` | object | Full AppDefinition record |
| `appVersion` | object | Full AppVersion record (with build_artifact) |
| `task` | object/null | Task record if launched from a HITL gate |
| `data` | object | Merged input data |

## `sdk.api`

HTTP client for calling backend APIs. All methods return fetch `Response` promises.

### `sdk.api.get(path, params?)`

```javascript
const response = await sdk.api.get('/work-management/task/id', {
  search: taskId,
});
const data = await response.json();
```

- `path`: API path (appended to `apiBaseUrl`)
- `params`: Object converted to URL query string

### `sdk.api.post(path, body)`

```javascript
const response = await sdk.api.post('/work-management/task', {
  title: 'Review document',
  assignment: { user_id: 'user-123' },
});
```

- `body`: JSON-serialized automatically
- Headers: `Content-Type: application/json`

### `sdk.api.patch(path, body)`

```javascript
await sdk.api.patch('/work-management/task', {
  id: taskId,
  status: { id: 3, name: 'completed' },
});
```

### `sdk.api.delete(path)`

```javascript
await sdk.api.delete(`/work-management/task/${taskId}`);
```

## `sdk.loom`

Authenticated client to the Link Loom Cloud backend (`sdk.context.loomCloudBaseUrl`). Every request carries the identity headers of the app session: `Authorization: Bearer <Veripass JWT>`, `x-veripass-organization-identity` and `x-loom-app-session` (read per request, so an offline session reopened online sends its new id). Methods resolve the envelope `result` and reject with `RuntimeHttpError` (`status`, `message`, `body`, `network`).

| Member | Description |
|--------|-------------|
| `get(path, params?, { signal }?)` | GET; `params` become the query string |
| `post(path, body?, { signal }?)` | POST with a JSON body |
| `patch(path, body?, { signal }?)` | PATCH with a JSON body |
| `delete(path, body?, { signal }?)` | DELETE with an optional JSON body |
| `headers()` | The identity headers of the next request |
| `baseUrl` | The Link Loom Cloud backend URL |

## `sdk.backend`

The app's own namespace in the Link Loom Cloud backend: the same client as `sdk.loom`, with every path prefixed by `/apps/<app-slug>/v1`. The host injects it **only** when the app definition declares its namespace in `definition.js`:

```javascript
// definition.js
backend: { namespace: 'stoneos-accounting' },
```

```javascript
const entries = await sdk.backend.get('/journal-entry/by-period', { period });
// GET {loomCloudBaseUrl}/apps/stoneos-accounting/v1/journal-entry/by-period?period=...
```

| Member | Description |
|--------|-------------|
| `get`, `post`, `patch`, `delete` | As in `sdk.loom`, with paths relative to the namespace |
| `headers()` | The identity headers `app-session` routes expect |
| `namespace` | The namespace (the app slug) |
| `prefix` | `/apps/<app-slug>/v1` |
| `baseUrl` | `{loomCloudBaseUrl}/apps/<app-slug>/v1` |

- The namespace must be the app's own slug: the `app-session` handler refuses a session of another app, so a definition naming another namespace gets no `sdk.backend`.
- Paths stay inside the namespace: a path with a `.` or `..` segment (also percent-encoded) or a backslash rejects with `TypeError` before any request.
- The query of `get` is flat: each key becomes one URL parameter, and arrays are joined with commas. A key holding an object, such as the axios form `{ params: { period } }`, rejects with `TypeError` before any request, because it would reach the backend as `[object Object]`.
- The object is frozen. Apps without backend do not receive it; code that must also run on hosts without `sdk.backend` falls back to `sdk.loom` with the full `/apps/<app-slug>/v1` prefix.
- Hosts that build their own `sdk` use `createAppBackend({ loom, appDefinition, appSlug })`, which answers the client or `null`.

## `sdk.navigate(path)`

Navigate to a different route within the app.

```javascript
sdk.navigate('/execution/abc123');
```

Triggers the host's `onNavigate` callback. The host decides how to handle navigation (route change, URL update, etc.).

## `sdk.saveDraft(payload)`

Persist intermediate state without completing the session.

```javascript
await sdk.saveDraft({
  form_data: { name: 'Draft', items: [...] },
  step: 2,
});
```

Calls `appSessionService.saveDraft()` with the session ID and payload.

## `sdk.submitOutput(payload)`

Complete the session by submitting final output.

```javascript
await sdk.submitOutput({
  decision: 'approved',
  comments: 'Looks good',
  attachments: [...],
});
```

1. Calls `appSessionService.submitOutput()` with session ID and payload
2. Triggers the host's `onSubmitOutput` callback with the payload

Use this for HITL approval/rejection, form submission, or any final output.

## `sdk.close()`

Close the app without submitting output.

```javascript
sdk.close();
```

Triggers the host's `onClose` callback. Does NOT cancel the session.

## `sdk.cancel(reason?)`

Cancel the session and close the app.

```javascript
sdk.cancel('User requested cancellation');
```

1. Calls `appSessionService.cancel()` with session ID and reason
2. Triggers the host's `onClose` callback

## Launch Modes

| Mode | Description | Typical Use |
|------|-------------|-------------|
| `fullscreen` | Full-page app | Primary workspace apps |
| `launcher` | Launched from catalog | App catalog quick launch |
| `task` | Launched from HITL task | Approval desk, review forms |
| `workflow` | Launched from workflow node | Automated pipeline step |
| `embedded` | Embedded in another view | Dashboard widgets, sidepanels |

## App Entry Point Convention

Apps must export a default React component from their entry file (`src/main.jsx`):

```javascript
// src/main.jsx
import App from './App';
export default App;

// src/App.jsx
export default function App({ sdk }) {
  return (
    <div>
      <h1>Hello {sdk.session.appSlug}</h1>
    </div>
  );
}
```

## Lifecycle

```
1. Session opened → sdk.session populated
2. App component mounted with sdk prop
3. App can read input, call APIs, navigate
4. App calls sdk.submitOutput() or sdk.close() to end
5. React root unmounted, blob URLs revoked
```

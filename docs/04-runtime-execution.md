# App Engine — Runtime Execution

## Overview

Runtime execution is how compiled apps are loaded and mounted in the browser. The `AppRuntimeHost` component handles session opening, module resolution via blob URL shims, and React mounting.

**Source:** `src/components/app-engine/runtime/AppRuntimeHost.component.jsx`

## Execution Flow

```
[1] Open Session (API call)
         │
         ▼
[2] Extract Entry File from build_artifact
         │
         ▼
[3] Prepare Runtime Code (shim system)
    ├── Populate window.__LOOM_RUNTIME__
    ├── Build shim code for each dependency
    ├── Create blob URLs for shims
    └── Replace tokens in app code
         │
         ▼
[4] Create App Blob URL
         │
         ▼
[5] Dynamic Import (import(blobUrl))
         │
         ▼
[6] Build SDK Object
         │
         ▼
[7] Mount React Component
         │
         ▼
[8] Cleanup on Unmount
```

## Session Opening (Step 1)

```javascript
const response = await appSessionService.open({
  app_slug: appSlug,
  route_path: routePath || '/',
  launch_mode: launchMode,
  input_payload: inputPayload,
});
```

The response contains:
```javascript
{
  result: {
    session: {
      id, app_definition_id, app_slug,
      app_version_id, launch_mode, route_path,
      input_payload
    },
    app_version: {
      build_artifact: {
        'app.js': { content: '...compiled ES module...' }
      }
    },
    app_definition: { /* full definition */ }
  }
}
```

## Shim System (Step 3)

### Problem

Compiled app code contains import statements like:

```javascript
import React from '$$LOOM_RUNTIME$$:react';
import { useState } from '$$LOOM_RUNTIME$$:react';
import ReactDOM from '$$LOOM_RUNTIME$$:react-dom/client';
```

These cannot be resolved by the browser. The shim system replaces them with blob URLs that re-export the host's modules.

### `EXTERNAL_IMPORT_PATTERN` Regex

```javascript
const EXTERNAL_IMPORT_PATTERN =
  /((?:from|import)\s*)(["'])(\$\$LOOM_RUNTIME\$\$:)?
  ((?:@link-loom\/cloud-sdk|react-router-dom|react-dom|react)
  (?:\/[^"']*)?)\2/g;
```

This matches:
- `from "$$LOOM_RUNTIME$$:react"` (tokenized)
- `from "react"` (bare specifier — backward compat)
- `import "react-dom/client"` (side-effect imports)
- Sub-paths like `react/jsx-runtime`, `react-dom/client`

### `window.__LOOM_RUNTIME__`

The global namespace where host modules are registered:

```javascript
window.__LOOM_RUNTIME__ = {
  'react': React,
  'react/jsx-runtime': ReactJSXRuntime,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  'react-router-dom': ReactRouterDOM,
};
```

### `buildShimCode(depKey)`

Generates ES module code that re-exports a host module:

```javascript
// For depKey = 'react':
const mod = window.__LOOM_RUNTIME__['react'];

// Default export
export default (typeof mod === 'function') ? mod
  : (mod && mod.default !== undefined) ? mod.default
  : mod;

// Named exports (filtered)
const { useState, useEffect, useCallback, ... } = mod;
export { useState, useEffect, useCallback, ... };
```

Named exports exclude `default`, `__esModule`, and invalid JS identifiers.

### `prepareRuntimeCode(rawCode)`

1. Initialize `window.__LOOM_RUNTIME__` if absent
2. Populate with HOST_MODULES
3. Find all unique dependency keys via regex matches
4. For each unique dependency:
   - Call `buildShimCode(depKey)` to generate shim code
   - Create `Blob` with `type: 'application/javascript'`
   - Create `blob:` URL via `URL.createObjectURL`
5. Replace all import tokens/bare specifiers in raw code with blob URLs
6. Return `{ processedCode, shimBlobUrls }` for later cleanup

### Example Transformation

```
Input:
  import React, { useState } from '$$LOOM_RUNTIME$$:react';
  import { createRoot } from '$$LOOM_RUNTIME$$:react-dom/client';

Output:
  import React, { useState } from 'blob:https://app.example.com/abc123';
  import { createRoot } from 'blob:https://app.example.com/def456';
```

## Dynamic Import (Steps 4-5)

```javascript
// Create blob for the entire app module
const appBlob = new Blob([processedCode], { type: 'application/javascript' });
const appBlobUrl = URL.createObjectURL(appBlob);

// Dynamic import
const module = await import(/* @vite-ignore */ appBlobUrl);
const AppComponent = module.default;
```

The `@vite-ignore` comment prevents the host app's Vite from trying to pre-process the dynamic import.

## SDK Object (Step 6)

The SDK object is passed as the `sdk` prop to the app component:

```javascript
const sdk = {
  // Session info
  session: {
    id,
    appId: sessionData.app_definition_id,
    appSlug: sessionData.app_slug,
    appVersionId: sessionData.app_version_id,
    launchMode: sessionData.launch_mode,
    routePath: sessionData.route_path,
  },

  // Input data
  input: sessionData.input_payload || inputPayloadRef.current,

  // Context
  context: {
    appDefinition: fullPayload.app_definition,
    appVersion: fullPayload.app_version,
    task: inputData?.task || null,
    data: inputData,
  },

  // API client (fetch-based)
  api: {
    get(path, params),    // GET with URLSearchParams
    post(path, body),     // POST with JSON body
    patch(path, body),    // PATCH with JSON body
    delete(path),         // DELETE
  },

  // Navigation + State
  navigate(path),         // Triggers onNavigate callback
  saveDraft(payload),     // Persists draft via session API
  submitOutput(payload),  // Submits output + triggers callback
  close(),                // Triggers onClose callback
  cancel(reason),         // Cancels session + triggers onClose
};
```

See `05-sdk-contract.md` for full API reference.

## React Mounting (Step 7)

```javascript
rootRef.current = ReactDOMClient.createRoot(mountRef.current);
rootRef.current.render(<AppComponent sdk={sdk} />);
setStatus('running');
```

The `mountRef` div is always present in the DOM (never conditionally rendered) to avoid React race conditions. Its `display` is toggled between `none` and `block` based on status.

## Cleanup (Step 8)

On component unmount:

```javascript
// Unmount React root
rootRef.current?.unmount();

// Revoke app blob URL
URL.revokeObjectURL(blobUrlRef.current);

// Revoke all shim blob URLs
shimBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
```

## Component Status States

| Status | Description | UI |
|--------|-------------|-----|
| `loading` | Session opening or module loading | Spinner + loading text |
| `running` | App mounted and executing | App component visible |
| `error` | Session or load failure | Error message |

## Key Design Decisions

- **Blob URLs over eval():** Blob URLs create proper ES module scope, supporting `import`/`export` natively. `eval()` would not support ES module syntax.
- **Single React instance:** All apps share the host's React via `window.__LOOM_RUNTIME__`, preventing version conflicts and duplicate React trees.
- **Always-present mount div:** The `mountRef` div is never unmounted during status transitions, preventing React race conditions where `createRoot` targets a detached element.
- **Transparent background:** The runtime container has `backgroundColor: 'transparent'` so apps inherit the host's background.

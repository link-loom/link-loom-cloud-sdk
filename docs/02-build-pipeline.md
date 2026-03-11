# App Engine — Build Pipeline

## Overview

The build pipeline compiles app source files into a deployable ES module bundle. It runs server-side in the `AppBuildService` class inside `bsh.linkloom.cloud.app-engine.svc`.

**Source:** `src/services/app/app-build/app-build.service.js`

## Build Flow Step-by-Step

```
[1] Resolve Definition
         │
         ▼
[2] Load Source Files
         │
         ▼
[3] Create Temp Directory (/tmp/loom-app-build-{buildId})
         │
         ▼
[4] Write Files to Disk
         │
         ▼
[5] Generate vite.config.js + package.json
         │
         ▼
[6] npm install --production=false (2min timeout)
         │
         ▼
[7] npx vite build (2min timeout)
         │
         ▼
[8] Collect Artifacts from dist/
         │
         ▼
[9] Cleanup Temp Directory
         │
         ▼
[10] Return { artifacts, build_log, build_status }
```

## Step Details

### Step 1: Resolve Definition

Accepts either `slug` or `app_definition_id`. Queries the `app_definition` collection.

```
Input:  { slug: 'sommatic-mission-control' }
   OR:  { app_definition_id: 'appdef-abc123' }
Output: AppDefinition document
```

### Step 2: Load Source Files

Queries the `app_file` collection for all non-deleted files belonging to the definition.

```
Filter: app_definition_id = {id} AND status.name NOT IN 'deleted'
Page size: 500
Returns: Array of { path, name, kind, content, parent_path, ... }
```

### Step 3: Create Temp Directory

```javascript
const buildId = crypto.randomBytes(8).toString('hex'); // 16 hex chars
const tempDir = path.join(os.tmpdir(), `loom-app-build-${buildId}`);
```

Each build is fully isolated — no shared state between concurrent builds.

### Step 4: Write Files to Disk

For each file record:
- **Folders:** Create directory recursively
- **Files:** Create parent dirs, then write `content` as UTF-8

### Step 5: Generate Vite Config

Two files are generated in the temp directory:

#### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const RUNTIME_EXTERNALS = [
  'react',
  'react-dom',
  'react-router-dom',
  '@link-loom/cloud-sdk'
];

const RUNTIME_TOKEN = '$$LOOM_RUNTIME$$';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      formats: ['es'],
      fileName: 'app',
    },
    rollupOptions: {
      external: (id) => {
        return RUNTIME_EXTERNALS.some(
          ext => id === ext || id.startsWith(ext + '/')
        );
      },
      output: {
        paths: (id) => {
          if (RUNTIME_EXTERNALS.some(
            ext => id === ext || id.startsWith(ext + '/')
          )) {
            return RUNTIME_TOKEN + ':' + id;
          }
          return id;
        },
      },
    },
    outDir: 'dist',
  },
});
```

#### `package.json`

```json
{
  "name": "loom-app-build",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

### Step 6: Install Dependencies

```bash
npm install --production=false
# cwd: tempDir
# timeout: 120,000ms (2 minutes)
# stdio: pipe (capture output)
```

### Step 7: Execute Build

```bash
npx vite build
# cwd: tempDir
# timeout: 120,000ms (2 minutes)
# encoding: utf8
```

Output is captured as the `build_log` string.

### Step 8: Collect Artifacts

Recursively reads the `dist/` directory. For each output file:

```javascript
{
  [relativePath]: {
    content: string,      // UTF-8 file content
    size_bytes: number,   // Buffer.byteLength(content, 'utf8')
    checksum: string,     // crypto.createHash('md5').update(content).digest('hex')
  }
}
```

### Step 9: Cleanup

```javascript
fs.rmSync(tempDir, { recursive: true, force: true });
// Errors silently ignored (try-catch with empty block)
```

Always runs, even on build failure.

## Tokenization Strategy: `$$LOOM_RUNTIME$$`

### Problem

Apps import shared dependencies (`react`, `react-dom`, etc.) but these must NOT be bundled — the host application already provides them.

### Solution

**Build-time:** Rollup's `external()` function marks matching imports as external. The `output.paths()` hook rewrites their import paths:

```
Source:   import React from 'react'
Compiled: import React from '$$LOOM_RUNTIME$$:react'

Source:   import { Link } from 'react-router-dom'
Compiled: import { Link } from '$$LOOM_RUNTIME$$:react-router-dom'

Source:   import { createRoot } from 'react-dom/client'
Compiled: import { createRoot } from '$$LOOM_RUNTIME$$:react-dom/client'
```

**Runtime:** The `AppRuntimeHost` component's `prepareRuntimeCode()` function replaces these tokens with blob URLs that re-export the host's already-loaded modules (see `04-runtime-execution.md`).

### External Matching Logic

The `external()` callback matches both exact package names AND sub-path imports:

```javascript
external: (id) => {
  return RUNTIME_EXTERNALS.some(
    ext => id === ext || id.startsWith(ext + '/')
  );
}
```

This means `react`, `react/jsx-runtime`, `react-dom/client`, etc. are all correctly externalized.

## Public API Methods

### `build({ params })`

Builds a single app. Returns `{ build_status, artifacts, build_log, duration_ms }`.

### `buildAll({ params })`

Builds all app definitions (optional `owning_product` filter). Returns summary with `{ total, passed, failed, results[] }`.

### `buildAndPublish({ params })`

Full pipeline: build → create version → attach artifacts. Orchestrates `AppBuildService.build()` + `AppVersionService.publish()` + `AppVersionService.update()`.

## Error Handling

- Build errors are truncated to 2000 characters
- Cleanup always runs (even on failure)
- Each method uses flat-style guard clauses (no nested if-else)
- Build timeout is 2 minutes for both `npm install` and `vite build`

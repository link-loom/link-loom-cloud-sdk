# App Engine — Official Apps

## Overview

Official apps are pre-built applications seeded from the filesystem during provisioning. They are stored in the backend service at `src/official-apps/` and have `is_official: true` on their definition records.

**Backend Source:** `bsh.linkloom.cloud.app-engine.svc/src/official-apps/`

## Directory Convention

```
official-apps/
├── {category}/
│   └── {slug}/
│       ├── definition.js          # App metadata + manifest + routes
│       └── files/
│           ├── manifest.json      # Vite-built manifest
│           ├── contracts/
│           │   ├── input.schema.json
│           │   └── output.schema.json
│           └── src/
│               ├── main.jsx       # Vite entry point
│               ├── App.jsx        # Root component (receives sdk prop)
│               ├── components/
│               │   ├── layout/
│               │   └── shared/
│               ├── hooks/
│               ├── styles/
│               └── views/
│                   └── {view-name}/
```

## All Official Apps

### HITL Category (1 app)

| Slug | Name | Description |
|------|------|-------------|
| `human-approval-gate` | Approval Gate | Legacy HITL approval interface for workflow gates |

### Utility Category (3 apps)

| Slug | Name | Launcher | Context Required | Description |
|------|------|----------|-----------------|-------------|
| `sommatic-approval-desk` | Approval Desk | system (hidden) | yes (task context) | Task-driven approval workflow interface |
| `sommatic-structured-intake` | Structured Intake | system (hidden) | yes | Form and data collection utility |
| `sommatic-tabular-workbench` | Tabular Workbench | system (hidden) | yes | Data grid and table manipulation |

### Workspace Category (6 apps)

| Slug | Name | Launcher | Pinnable | Description |
|------|------|----------|----------|-------------|
| `sommatic-mission-control` | Mission Control | visible | yes | Primary command surface: commands, plans, approvals, results |
| `sommatic-decision-explorer` | Decision Explorer | visible | no | Decision tree visualization and exploration |
| `sommatic-document-intelligence-desk` | Document Intelligence Desk | visible | no | Document processing and analysis |
| `sommatic-agentops-lab` | AgentOps Lab | visible | no | Agent experimentation and testing |
| `sommatic-flow-navigator` | Flow Navigator | visible | no | Workflow execution viewer and navigator |
| `sommatic-signals-observatory` | Signals Observatory | visible | no | Event and signal monitoring dashboard |

## Definition Schema

Each `definition.js` exports:

```javascript
export default {
  slug: string,                     // Unique kebab-case identifier
  name: string,                     // Display name
  description: string,              // User-facing description
  category: string,                 // 'hitl' | 'utility' | 'workspace'
  version: string,                  // Semver (e.g., '1.0.0')
  icon: string,                     // Material icon name
  tags: string[],                   // Search tags
  launcher_visible: boolean,        // Show in launcher?

  publisher: {
    identity: string,               // e.g., 'org_sommatic_ai'
    profile: {
      name: string,
      verified: boolean,
      url: string,
      logo_url: string | null,
    },
  },

  routes: [
    {
      route_key: string,            // Unique route ID
      path: string,                 // Route pattern (e.g., '/', '/execution/:id')
      name: string,                 // Route display name
      description: string,
      component_file_path: string,  // Relative path to view file
      is_entry: boolean,            // Entry point?
      launcher_visible: boolean,
      supported_launch_modes: string[],
      supported_contexts: string[],
      layout: string,               // 'fullscreen' etc.
      sort_order: number,
    },
  ],

  manifest: {
    entry_route: string,
    kind: string,
    launcher_visibility: string,    // 'visible' | 'system' | 'hidden'
    launcher_visible: boolean,
    pinnable: boolean,
    entry_behavior: string,
    requires_context: boolean,
    supported_launch_modes: string[],
    permissions: string[],          // e.g., ['mission-control.view', 'mission-control.execute']
    capabilities: string[],         // e.g., ['command-compose', 'execution-plan']
    allowed_dependencies: string[],
  },
};
```

## Contract Files

### `input.schema.json`

JSON Schema defining what the app expects as input:

```json
{
  "type": "object",
  "properties": {
    "approval_id": { "type": "string" },
    "context_data": { "type": "object" },
    "approvers": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

### `output.schema.json`

JSON Schema defining what the app produces as output (via `sdk.submitOutput()`).

## Provisioning Flow

1. Backend reads `official-apps/index.js` which exports all definition modules
2. For each definition: creates `AppDefinition` record with `is_official: true`
3. Files from the `files/` directory are created as `AppFile` records
4. The app can then be built and published through the standard pipeline

## App Source Code Convention

All apps receive the `sdk` prop:

```javascript
// src/App.jsx
export default function App({ sdk }) {
  const { session, input, context, api } = sdk;
  return (
    <Layout>
      {/* App UI */}
    </Layout>
  );
}
```

Entry point re-exports the root component:

```javascript
// src/main.jsx
import App from './App';
export default App;
```

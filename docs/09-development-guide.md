# App Engine — Development Guide

## Repository Structure

The App Engine spans two repositories:

```
link-loom-cloud-sdk/                     # Frontend SDK (this repo)
├── src/
│   ├── components/app-engine/
│   │   ├── catalog/                     # AppCatalogCard, AppCatalogGrid
│   │   ├── runtime/                     # AppRuntimeHost
│   │   ├── studio/                      # AppStudio + sub-panels
│   │   └── defaults/                    # UI defaults + mergeDefaults
│   ├── features/app-engine/
│   │   ├── context/                     # AppEngineSDKProvider
│   │   └── hooks/                       # useAppStudio, useAppRuntime
│   ├── services/app-engine/             # 7 API service clients
│   └── stories/app-engine/              # Storybook stories
├── docs/                                # Architecture documentation
├── .storybook/                          # Storybook config
└── dist/                                # Rollup build output

bsh.linkloom.cloud.app-engine.svc/       # Backend service
├── src/
│   ├── models/app/                      # AppDefinition, AppVersion, AppFile
│   ├── services/app/                    # Build, Version, File, Session services
│   ├── routes/api/app/                  # API route handlers
│   └── official-apps/                   # Pre-built official apps
```

## Dependency Chain

```
@link-loom/cloud-sdk (this package)
    │
    └── consumed by: @link-loom/react-sdk (re-exports)
                         │
                         └── consumed by: host webapps
                             (bsh.sommatic.client.webapp, bsh.sommatic.admin.webapp, etc.)
```

## Local Development Setup

### 1. SDK Development

```bash
cd link-loom-cloud-sdk

# Install dependencies
npm install

# Build the SDK (Rollup)
npm run build
# Output: dist/cloud-sdk.cjs.cjs, dist/cloud-sdk.esm.js

# Run Storybook for interactive development
npm run storybook
# Opens on http://localhost:6006
```

### 2. Backend Development

```bash
cd bsh.linkloom.cloud.app-engine.svc

# Install dependencies
npm install

# Configure environment
cp .env.sample .env
# Edit .env with database URL, secrets, etc.

# Start the service
npm start
```

### 3. Local Linking

When developing SDK + host webapp simultaneously:

```bash
# In link-loom-cloud-sdk:
npm run build

# In host webapp (e.g., bsh.sommatic.client.webapp):
# Use local file path in package.json:
# "@link-loom/cloud-sdk": "file:../../link-loom/github/link-loom-cloud-sdk"
npm install
```

## Adding a New Component

1. Create component file: `src/components/app-engine/{scope}/{Name}.component.jsx`
2. Follow Veripass props pattern:
   - Accept `ui` prop (visual config)
   - Define defaults in `appEngine.defaults.js`
   - Use `mergeDefaults()` internally
3. Export from `src/index.js`
4. Create Storybook story in `src/stories/app-engine/`
5. Update docs if architectural

### Component Template

```javascript
import React from 'react';
import { MY_DEFAULTS, mergeDefaults } from '../defaults/appEngine.defaults';

const MyComponent = ({
  ui = MY_DEFAULTS,
  className = '',
  // ...domain props
}) => {
  const config = mergeDefaults(MY_DEFAULTS, ui);
  const theme = config.theme;

  return (
    <div className={className || undefined} style={{ color: theme.textPrimary }}>
      {config.someLabel}
    </div>
  );
};

export default MyComponent;
```

## Adding a New Service

1. Create service directory: `src/services/app-engine/{entity}/`
2. Create service file: `{entity}.service.js`
3. Extend `BaseApi`:

```javascript
import BaseApi from '../../base/api.service';

class AppEngineMyService extends BaseApi {
  #serviceEndpoints = {
    baseUrl: import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || '',
    get: '/app-engine/my-entity/',
    create: '/app-engine/my-entity',
    update: '/app-engine/my-entity',
    delete: '/app-engine/my-entity',
  };

  constructor(args) {
    super(args);
    this.setServiceEndpoints(this.#serviceEndpoints);
    if (args?.baseUrl) {
      this.setBaseUrl(args.baseUrl);
    }
  }

  async customMethod(payload) {
    return this.post(payload, {
      endpoint: this.#serviceEndpoints.baseUrl + '/app-engine/my-entity/custom',
    });
  }
}

export default AppEngineMyService;
```

4. Export from `src/index.js`
5. Add to `AppEngineSDKProvider` context

## Adding an Official App

1. Create directory structure:

```
official-apps/{category}/{slug}/
├── definition.js
└── files/
    ├── contracts/
    │   ├── input.schema.json
    │   └── output.schema.json
    └── src/
        ├── main.jsx
        └── App.jsx
```

2. Define the app in `definition.js` (see `08-official-apps.md`)
3. Register in `official-apps/index.js`
4. Provision to create DB records
5. Build and publish through the standard pipeline

## Build Workflow

```
[Developer edits source in Studio]
         │
         ▼
[Save] → appFileService.applyChanges()  → DB updated
         │
         ▼
[Build] → appBuildService.buildSingle() → Vite compile → artifacts
         │
         ▼
[Publish] → appVersionService.publish() → immutable snapshot
         │
         ▼
[Activate] → appVersionService.activate() → version goes live
         │
         ▼
[Launch] → appSessionService.open() → runtime loads artifact
```

## Storybook Usage

Stories are in `src/stories/app-engine/` with `tags: ['autodocs']` for auto-generated documentation.

```bash
# Development mode
npm run storybook

# Build static Storybook
npm run build-storybook
```

### Story Pattern

```javascript
import { CATALOG_UI_DEFAULTS, mergeDefaults } from '../../components/app-engine/defaults/appEngine.defaults';

export default {
  title: 'App Engine/Catalog/AppCatalogCard',
  component: AppCatalogCard,
  tags: ['autodocs'],
  argTypes: {
    ui: { control: 'object' },
  },
};

export const Default = {
  args: {
    app: sampleApp,
    onOpen: () => console.log('Open'),
  },
};

export const CustomUI = {
  args: {
    app: sampleApp,
    ui: mergeDefaults(CATALOG_UI_DEFAULTS, {
      title: 'Custom Title',
      theme: { brandPrimary: '#FF5722' },
    }),
  },
};
```

## SDK Build

The SDK is built with Rollup 4:

```bash
npm run build
```

Outputs:
- `dist/cloud-sdk.cjs.cjs` — CommonJS format
- `dist/cloud-sdk.esm.js` — ES module format

Peer dependencies (`react`, `react-dom`, `react-router-dom`) are externalized.

## Testing Checklist

After making changes:

1. `npm run build` in cloud-sdk — no build errors
2. Verify exports work: `import { AppStudioComponent } from '@link-loom/cloud-sdk'`
3. `npm run storybook` — all stories render with interactive controls
4. Link to host webapp and verify:
   - Catalog renders apps with correct styles
   - Studio loads, edits files, builds, publishes
   - Runtime mounts apps with working SDK
5. Verify backward compatibility: components without `ui` prop render identically to pre-refactor

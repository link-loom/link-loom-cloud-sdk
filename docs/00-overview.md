# App Engine — Overview

## What App Engine Is

App Engine is a sub-system of the Link Loom Cloud platform that allows organizations to **define, build, publish, and execute** custom micro-applications. Each app is a self-contained React component bundle that receives a runtime SDK and operates within a managed session.

App Engine serves three audiences:

| Audience | Role | Key Activities |
|----------|------|---------------|
| **App Developers** | Create apps | Write React components, define routes, contracts, and manifest |
| **Platform Operators** | Manage apps | Build, publish, activate versions, manage catalog |
| **Integrators** | Embed apps | Consume SDK components (Catalog, Studio, Runtime) in host applications |

## Pipeline: Define → Build → Publish → Session → Runtime

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   DEFINE     │────▶│    BUILD     │────▶│   PUBLISH    │
│              │     │              │     │              │
│ AppDefinition│     │ Vite/Rollup  │     │ AppVersion   │
│ AppFile[]    │     │ temp dir     │     │ immutable    │
│ (mutable)    │     │ $$LOOM_      │     │ snapshot     │
│              │     │ RUNTIME$$    │     │              │
└──────────────┘     │ tokenization │     └──────┬───────┘
                     └──────────────┘            │
                                                 │ activate()
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RUNTIME    │◀────│   SESSION    │◀────│   ACTIVE     │
│              │     │              │     │   VERSION    │
│ Blob URL     │     │ AppSession   │     │              │
│ shim system  │     │ open()       │     │ build_artifact│
│ React mount  │     │ SDK object   │     │ is_active=true│
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Stage Details

1. **Define** — Developers create an `AppDefinition` (mutable) with metadata (name, slug, manifest), then add `AppFile` records (source code stored per-file in MongoDB) via App Studio.

2. **Build** — The build service writes source files to a temp directory, generates a Vite + Rollup config that marks `react`, `react-dom`, `react-router-dom`, and `@link-loom/cloud-sdk` as externals, and replaces their import paths with `$$LOOM_RUNTIME$$:` tokens. The output is an ES module bundle.

3. **Publish** — The version service creates an immutable `AppVersion` snapshot containing frozen copies of manifest, routes, contracts, source tree, and the compiled `build_artifact`. The version is initially inactive.

4. **Activate** — An operator activates a version, which sets `is_active = true` on that version and updates the parent definition's `active_version_id`. Only one version is active per app at any time.

5. **Session** — When a user launches an app, the runtime opens a session via the session service. The response includes the active version's `build_artifact` (compiled code).

6. **Runtime** — The `AppRuntimeHost` component receives the compiled code, replaces `$$LOOM_RUNTIME$$:` tokens with blob URL shims that re-export the host's React/ReactDOM modules, dynamically imports the processed code, builds the SDK object, and mounts the app component.

## SDK Package Structure

```
@link-loom/cloud-sdk
├── Components
│   ├── AppCatalogGridComponent   — Browse and manage apps
│   ├── AppCatalogCardComponent   — Individual app card
│   ├── AppStudioComponent        — Full IDE for editing apps
│   └── AppRuntimeHostComponent   — Execute compiled apps
├── Context + Hooks
│   ├── AppEngineSDKProvider      — Service provider context
│   ├── useAppEngineSDK()         — Access services
│   ├── useAppStudio()            — Studio state management
│   └── useAppRuntime()           — Runtime lifecycle hook
├── Services (7 API clients)
│   ├── AppDefinition, AppVersion, AppFile, AppBuild
│   ├── AppSession, AppPreference, AppScaffold
│   └── entityServiceAdapter (CRUD utility)
└── Defaults + Utilities
    ├── STUDIO_UI_DEFAULTS
    ├── CATALOG_UI_DEFAULTS
    ├── RUNTIME_UI_DEFAULTS
    └── mergeDefaults()
```

## Key Architectural Decisions

- **Per-file storage**: Source code stored as individual MongoDB documents (AppFile), enabling granular edits without loading entire codebases.
- **Build-time tokenization**: External dependencies are NOT bundled — they are replaced with `$$LOOM_RUNTIME$$` tokens and resolved at runtime via blob URL shims.
- **Immutable versions**: Published versions are frozen snapshots. The mutable definition is the working draft; versions are deployment artifacts.
- **Single-instance React**: The shim system ensures all apps share the host's React instance, preventing version conflicts and duplicate state trees.
- **Session-based execution**: Every app launch creates a session record, enabling state persistence, draft saving, and output submission.

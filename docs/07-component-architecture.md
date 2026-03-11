# App Engine — Component Architecture

## Component Tree

```
AppEngineSDKProvider (context)
├── AppCatalogGrid
│   └── AppCatalogCard (per app)
├── AppStudio
│   ├── StudioToolbar
│   ├── FileExplorer
│   ├── EditorArea (Monaco)
│   ├── PropertiesPanel
│   └── BottomPanel
└── AppRuntimeHost
```

## Props Contract (Veripass Pattern)

All components follow the Veripass SDK pattern for visual customization:

- **`ui`** — Contains all visual configuration: text labels as flat properties, `theme` nested inside `ui.theme`
- **`organization`** — Organization context (where applicable)
- **`environment`** / **`apiKey`** — Connection config (where applicable)

Labels live directly in `ui` (NOT in a nested `labels` object). Theme lives in `ui.theme`.

### Defaults + Merge

```javascript
import { CATALOG_UI_DEFAULTS, mergeDefaults } from '@link-loom/cloud-sdk';

<AppCatalogGridComponent
  ui={mergeDefaults(CATALOG_UI_DEFAULTS, {
    title: 'Mis Apps',
    searchPlaceholder: 'Buscar...',
    theme: {
      brandPrimary: '#FF5722',
    },
  })}
/>
```

`mergeDefaults()` performs a deep merge: nested objects are merged recursively, scalar values are overwritten. `null` and `undefined` values are ignored.

---

## AppCatalogGrid

Browse, search, and manage apps.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ui` | object | `CATALOG_UI_DEFAULTS` | Visual config (labels + theme) |
| `appDefinitionService` | service | — | API service for definitions |
| `appPreferenceService` | service | — | API service for preferences |
| `organizationId` | string | — | Organization filter |
| `onOpenApp` | function | — | `(app) => void` |
| `onEditApp` | function | — | `(app) => void` |
| `onCreateApp` | function | — | `() => void` |
| `onDeleteApp` | function | — | `(app) => void` |
| `onPinApp` | function | — | `(app) => void` |
| `onFavoriteApp` | function | — | `(app) => void` |
| `onPreferencesLoaded` | function | — | `(prefs) => void` |
| `className` | string | `''` | CSS class for root |
| `renderCard` | function | — | `({ app, preference, onOpen, onEdit, onDelete }) => JSX` |
| `renderEmptyState` | function | — | `({ searchQuery }) => JSX` |

### `ui` Keys (CATALOG_UI_DEFAULTS)

**Labels:** `title`, `subtitle`, `newAppLabel`, `createAppLabel`, `searchPlaceholder`, `tabAll`, `tabWorkspaces`, `tabUtilities`, `noAppsSearch`, `noAppsYet`, `noAppsSearchHint`, `noAppsHint`, `untitledApp`, `noDescription`, `menuOpen`, `menuEdit`, `menuDelete`, `addToFavorites`, `removeFromFavorites`, `pin`, `unpin`

**Layout:** `containerless` (boolean — when `true`, removes outer Bootstrap card wrapper), `gridColumnClass` (Bootstrap grid class)

**Theme:** `brandPrimary`, `brandPrimaryHover`, `iconDefaultBackground`, `favoriteActive`, `favoriteInactive`, `pinActive`, `pinInactive`, `menuIcon`, `deleteColor`, `hoverBorderColor`, `hoverShadow`

---

## AppCatalogCard

Individual app card rendered by the grid.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `app` | object | — | App definition record |
| `ui` | object | `CATALOG_UI_DEFAULTS` | Visual config |
| `onOpen` | function | — | Open callback |
| `onEdit` | function | — | Edit callback |
| `onDelete` | function | — | Delete callback |
| `onPin` | function | — | Pin callback |
| `onFavorite` | function | — | Favorite callback |
| `preference` | object | — | `{ is_favorite, is_pinned }` |
| `className` | string | `''` | CSS class |
| `renderContainer` | function | — | `({ children, onClick }) => JSX` — replaces default card |

When `renderContainer` is provided, the Bootstrap card wrapper is replaced with the custom container. This enables fully custom card designs.

---

## AppStudio

Full IDE for editing app source code, properties, and manifest.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appDefinitionId` | string | — | App to edit |
| `appDefinitionService` | service | — | Definition API |
| `appFileService` | service | — | File API |
| `appVersionService` | service | — | Version API |
| `appBuildService` | service | — | Build API |
| `ui` | object | `STUDIO_UI_DEFAULTS` | Visual config (cascaded to all sub-panels) |
| `onBack` | function | — | Navigate back |
| `onRun` | function | — | Run app |
| `onNavigateToRuntime` | function | — | Open runtime preview |
| `className` | string | `''` | CSS class |

### `ui` Keys (STUDIO_UI_DEFAULTS)

**Toolbar:** `untitledApp`, `unsavedLabel`, `saveLabel`, `buildLabel`, `previewLabel`, `publishLabel`, `runLabel`

**Explorer:** `explorerTitle`

**Editor:** `noFileOpen`, `noFileHint`, `editorOptions` (Monaco config: `minimap`, `fontSize`, `tabSize`, `theme`, `lineNumbers`, `wordWrap`, `scrollBeyondLastLine`)

**Properties Panel:** `propertiesTitle`, `tabGeneral`, `tabManifest`, `tabRoutes`, `fieldName`, `fieldSlug`, `fieldDescription`, `fieldCategory`, `fieldIcon`, `fieldTags`, `fieldKind`, `fieldLauncherVisibility`, `fieldEntryBehavior`, `fieldPinnable`, `fieldRequiresContext`, `fieldEntryRoute`, `fieldAdvancedJson`, `noRoutes`, `unnamedRoute`, `kindWorkspace`, `kindUtility`, `visibilityVisible`, `visibilityHidden`, `visibilitySystem`, `behaviorHome`, `behaviorContextRequired`, `behaviorRouteOnly`

**Bottom Panel:** `tabBuildOutput`, `tabProblems`, `noBuildOutput`, `noProblems`

**Theme:** `background`, `panelBackground`, `tabsBackground`, `inputBackground`, `border`, `brandPrimary`, `brandPrimaryHover`, `brandPrimaryHighlight`, `brandPrimarySubtle`, `textPrimary`, `textSecondary`, `textMuted`, `success`, `successHover`, `error`, `warning`, `warningBackground`, `fileExplorerWidth`, `propertiesPanelWidth`, `bottomPanelHeight`, `toolbarMinHeight`, `fileColors` (map: `jsx`, `js`, `css`, `json`, `html`, `folder`, `default`)

---

## Sub-panels

### StudioToolbar

Toolbar with save/build/publish/preview/run buttons. Accepts `renderExtraActions({ theme, ui })` to inject custom buttons.

### FileExplorer

Tree view of app files. Reads `ui.explorerTitle`, `ui.theme.fileColors`, `ui.theme.fileExplorerWidth`.

### EditorArea

Monaco code editor with tabs. Reads `ui.editorOptions`, `ui.noFileOpen`, `ui.noFileHint`.

### PropertiesPanel

3-tab properties panel (General, Manifest, Routes). Reads all `fieldXxx` and `tabXxx` labels.

### BottomPanel

Collapsible build output/problems panel. Reads `ui.tabBuildOutput`, `ui.tabProblems`, `ui.noBuildOutput`, `ui.noProblems`.

---

## AppRuntimeHost

Execute compiled apps in an isolated runtime.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appSlug` | string | — | App to launch |
| `routePath` | string | `'/'` | Initial route |
| `launchMode` | string | `'fullscreen'` | Launch context |
| `inputPayload` | object | — | Input data for app |
| `appSessionService` | service | — | Session API |
| `apiBaseUrl` | string | `''` | Backend URL for SDK api client |
| `ui` | object | `RUNTIME_UI_DEFAULTS` | Visual config |
| `onClose` | function | — | Close callback |
| `onSubmitOutput` | function | — | Output callback |
| `onNavigate` | function | — | Navigation callback |
| `className` | string | `''` | CSS class |
| `renderLoading` | function | — | `() => JSX` |
| `renderError` | function | — | `({ error }) => JSX` |

### `ui` Keys (RUNTIME_UI_DEFAULTS)

**Labels:** `loadingText`, `errorTitle`

**Theme:** `spinnerColor`, `errorColor`, `textSecondary`, `minHeight`

---

## Hooks

### `useAppStudio()`

Studio state management hook. Returns:

```javascript
{
  appDefinition, fileTree, openFiles, activeFilePath,
  isSaving, buildStatus, buildLog, buildErrors, isDirty,
  loadStudioPayload(id), openFile(file), updateFileContent(path, content),
  closeFile(path), save(id), build(id), publish(id), updateDefinition(updated),
}
```

### `useAppRuntime()`

Runtime lifecycle hook (2-phase: open + mount). Returns:

```javascript
{
  status, error, session,
  openApp({ appSlug, routePath, launchMode, inputPayload, appSessionService, apiBaseUrl }),
  mountApp(containerRef, AppComponent, sdk),
  cleanup(),
}
```

## Backward Compatibility

All new `ui` props have defaults matching the original hardcoded values. No existing props were removed. Consumers that don't pass `ui` get identical behavior to the pre-refactor components.

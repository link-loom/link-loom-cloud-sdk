// ── App Engine UI Defaults ──────────────────────────────────────────
// Follows Veripass contract pattern: all visual customization inside
// a `ui` prop, with `theme` nested inside `ui.theme`.
// Text labels live directly in `ui` (not in a nested labels object).
// Consumers override selectively via spread + merge.

// ── Studio UI Defaults ─────────────────────────────────────────────

export const STUDIO_UI_DEFAULTS = {
  // Toolbar labels
  untitledApp: 'Untitled App',
  unsavedLabel: 'Unsaved',
  saveLabel: 'Save',
  buildLabel: 'Build',
  previewLabel: 'Preview',
  publishLabel: 'Publish',
  runLabel: 'Run',

  // File explorer labels
  explorerTitle: 'Explorer',

  // Editor labels
  noFileOpen: 'No file open',
  noFileHint: 'Select a file from the explorer to start editing',

  // Properties panel labels
  propertiesTitle: 'Properties',
  tabGeneral: 'General',
  tabManifest: 'Manifest',
  tabRoutes: 'Routes',
  fieldName: 'Name',
  fieldSlug: 'Slug',
  fieldDescription: 'Description',
  fieldCategory: 'Category',
  fieldIcon: 'Icon',
  fieldTags: 'Tags',
  fieldKind: 'Kind',
  fieldLauncherVisibility: 'Launcher Visibility',
  fieldEntryBehavior: 'Entry Behavior',
  fieldPinnable: 'Pinnable',
  fieldRequiresContext: 'Requires Context',
  fieldEntryRoute: 'Entry Route',
  fieldAdvancedJson: 'Advanced (JSON)',
  noRoutes: 'No routes defined',
  unnamedRoute: 'Unnamed route',
  kindWorkspace: 'Workspace',
  kindUtility: 'Utility',
  visibilityVisible: 'Visible',
  visibilityHidden: 'Hidden',
  visibilitySystem: 'System',
  behaviorHome: 'Home',
  behaviorContextRequired: 'Context Required',
  behaviorRouteOnly: 'Route Only',

  // Bottom panel labels
  tabBuildOutput: 'Build Output',
  tabProblems: 'Problems',
  noBuildOutput: 'No build output yet. Click "Build" to compile the app.',
  noProblems: 'No problems detected.',

  // Monaco editor config
  editorOptions: {
    minimap: { enabled: true },
    fontSize: 13,
    tabSize: 2,
    theme: 'vs-dark',
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 8 },
  },

  // Theme (nested — Veripass pattern)
  theme: {
    background: '#1E1E1E',
    surface: '#252526',
    panelBackground: '#1F1E26',
    tabsBackground: '#252526',
    inputBackground: '#2B2A33',
    border: '#6B728040',
    brandPrimary: '#7C3AED',
    brandPrimaryHover: '#6D28D9',
    brandPrimaryHighlight: '#7C3AED20',
    brandPrimarySubtle: '#A78BFA',
    textPrimary: '#EAEAF0',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    success: '#10B981',
    successHover: '#059669',
    error: '#EF4444',
    warning: '#F59E0B',
    warningBackground: '#F59E0B20',
    fileExplorerWidth: 240,
    propertiesPanelWidth: 300,
    bottomPanelHeight: 200,
    toolbarMinHeight: 48,
    fileColors: {
      jsx: '#61DAFB',
      js: '#F7DF1E',
      css: '#264DE4',
      json: '#6B7280',
      html: '#E34F26',
      folder: '#F59E0B',
      default: '#6B7280',
    },
  },

  // Light theme variant
  lightTheme: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    panelBackground: '#F3F4F6',
    tabsBackground: '#F9FAFB',
    inputBackground: '#FFFFFF',
    border: '#E5E7EB',
    brandPrimary: '#7C3AED',
    brandPrimaryHover: '#6D28D9',
    brandPrimaryHighlight: '#7C3AED15',
    brandPrimarySubtle: '#6D28D9',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    success: '#10B981',
    successHover: '#059669',
    error: '#EF4444',
    warning: '#F59E0B',
    warningBackground: '#F59E0B15',
    fileExplorerWidth: 240,
    propertiesPanelWidth: 300,
    bottomPanelHeight: 200,
    toolbarMinHeight: 48,
    fileColors: {
      jsx: '#0891B2',
      js: '#CA8A04',
      css: '#2563EB',
      json: '#6B7280',
      html: '#DC2626',
      folder: '#D97706',
      default: '#6B7280',
    },
  },
};

// ── Marketplace UI Defaults ─────────────────────────────────────────

export const MARKETPLACE_UI_DEFAULTS = {
  // Grid labels
  title: 'App Marketplace',
  subtitle: 'Browse, manage and launch your apps',
  newAppLabel: 'New App',
  createAppLabel: 'Create App',
  searchPlaceholder: 'Search apps...',
  tabAll: 'All Apps',
  tabWorkspaces: 'Workspaces',
  tabUtilities: 'Utilities',
  noAppsSearch: 'No apps match your search',
  noAppsYet: 'No apps yet',
  noAppsSearchHint: 'Try a different search term',
  noAppsHint: 'Create your first app to get started',

  // Card labels
  untitledApp: 'Untitled App',
  noDescription: 'No description',
  menuOpen: 'Open',
  menuEdit: 'Edit in Studio',
  menuDelete: 'Delete',
  addToFavorites: 'Add to favorites',
  removeFromFavorites: 'Remove from favorites',
  pin: 'Pin',
  unpin: 'Unpin',

  // Layout
  containerless: false,
  gridColumnClass: 'col-12 col-sm-6 col-md-4 col-xl-3',

  // Theme (nested — Veripass pattern)
  theme: {
    brandPrimary: '#7C3AED',
    brandPrimaryHover: '#6D28D9',
    iconDefaultBackground: '#f0e7ff',
    favoriteActive: '#F59E0B',
    favoriteInactive: '#9CA3AF',
    pinActive: '#6D28D9',
    pinInactive: '#9CA3AF',
    menuIcon: '#9CA3AF',
    deleteColor: '#EF4444',
    hoverBorderColor: '#6c757d',
    hoverShadow: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
  },
};

// ── Runtime UI Defaults ────────────────────────────────────────────

export const RUNTIME_UI_DEFAULTS = {
  // Labels
  loadingText: 'Loading app...',
  errorTitle: 'Failed to load app',

  // Theme (nested — Veripass pattern)
  theme: {
    spinnerColor: '#7C3AED',
    errorColor: '#EF4444',
    textSecondary: '#9CA3AF',
    minHeight: 400,
  },
};

// ── Merge Utility ──────────────────────────────────────────────────

export function mergeDefaults(defaults, overrides) {
  if (!overrides) return defaults;

  const result = { ...defaults };

  for (const key of Object.keys(overrides)) {
    if (overrides[key] === undefined || overrides[key] === null) continue;

    const isObjectMerge =
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key]);

    result[key] = isObjectMerge
      ? mergeDefaults(defaults[key], overrides[key])
      : overrides[key];
  }

  return result;
}

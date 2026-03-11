import React from 'react';
import AppStudio from '../../components/app-engine/studio/AppStudio.component';
import { STUDIO_UI_DEFAULTS, mergeDefaults } from '../../components/app-engine/defaults/appEngine.defaults';

export default {
  title: 'App Engine/Studio/AppStudio',
  component: AppStudio,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ui: { control: 'object' },
    className: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

const sampleDefinition = {
  id: 'def-001',
  name: 'Inventory Manager',
  slug: 'inventory-manager',
  description: 'Track inventory across warehouses.',
  category: 'Operations',
  icon: '📦',
  organization_id: 'org-001',
  manifest: {
    kind: 'workspace',
    launcher_visibility: 'visible',
    entry_behavior: 'home',
    pinnable: true,
    requires_context: false,
    entry_route: '/',
  },
  routes: [
    { path: '/', name: 'Home' },
    { path: '/settings', name: 'Settings' },
  ],
  tags: ['operations', 'inventory'],
};

const sampleFileTree = [
  { kind: 'folder', path: '/src', name: 'src', parent_path: null },
  { kind: 'folder', path: '/src/components', name: 'components', parent_path: '/src' },
  { kind: 'folder', path: '/src/views', name: 'views', parent_path: '/src' },
  { kind: 'file', path: '/src/App.jsx', name: 'App.jsx', language: 'jsx', parent_path: '/src', id: 'f-001' },
  { kind: 'file', path: '/src/index.js', name: 'index.js', language: 'js', parent_path: '/src', id: 'f-002' },
  { kind: 'file', path: '/src/styles.css', name: 'styles.css', language: 'css', parent_path: '/src', id: 'f-003' },
  { kind: 'file', path: '/src/components/Dashboard.jsx', name: 'Dashboard.jsx', language: 'jsx', parent_path: '/src/components', id: 'f-004' },
  { kind: 'file', path: '/src/views/Home.jsx', name: 'Home.jsx', language: 'jsx', parent_path: '/src/views', id: 'f-005' },
  { kind: 'file', path: '/src/views/Settings.jsx', name: 'Settings.jsx', language: 'jsx', parent_path: '/src/views', id: 'f-006' },
  { kind: 'file', path: '/package.json', name: 'package.json', language: 'json', parent_path: '/', id: 'f-007' },
];

const sampleFileContents = {
  'f-001': `import React from 'react';\nimport Dashboard from './components/Dashboard';\n\nexport default function App({ sdk }) {\n  return (\n    <div className="app">\n      <Dashboard sdk={sdk} />\n    </div>\n  );\n}\n`,
  'f-002': `export { default } from './App';\n`,
  'f-003': `.app {\n  padding: 16px;\n  font-family: system-ui, sans-serif;\n}\n`,
  'f-004': `import React from 'react';\n\nexport default function Dashboard({ sdk }) {\n  return (\n    <div>\n      <h1>Inventory Dashboard</h1>\n      <p>Welcome to {sdk?.session?.app_name}</p>\n    </div>\n  );\n}\n`,
  'f-005': `import React from 'react';\n\nexport default function Home() {\n  return <div>Home View</div>;\n}\n`,
  'f-006': `import React from 'react';\n\nexport default function Settings() {\n  return <div>Settings View</div>;\n}\n`,
  'f-007': `{\n  "name": "inventory-manager",\n  "version": "1.0.0"\n}\n`,
};

const createMockDefinitionService = () => ({
  getStudioPayload: async ({ id }) => ({
    result: {
      definition: sampleDefinition,
      file_tree: sampleFileTree,
    },
  }),
});

const createMockFileService = () => ({
  getFileContent: async ({ search }) => ({
    result: { content: sampleFileContents[search] || '// Empty file' },
  }),
  applyChanges: async () => ({ result: { success: true } }),
});

const createMockVersionService = () => ({
  publish: async () => ({
    result: { version: '1.0.1' },
  }),
});

const createMockBuildService = () => ({
  buildSingle: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      result: {
        build_status: 'success',
        build_log: [
          '[info] Starting build for inventory-manager...',
          '[info] Resolving dependencies...',
          '[info] Compiling /src/App.jsx',
          '[info] Compiling /src/components/Dashboard.jsx',
          '[info] Compiling /src/views/Home.jsx',
          '[info] Compiling /src/views/Settings.jsx',
          '[success] Build completed in 1.2s',
          '[info] Output: 2 chunks, 4.8kb total',
        ].join('\n'),
      },
    };
  },
});

export const Default = {
  args: {
    appDefinitionId: 'def-001',
    appDefinitionService: createMockDefinitionService(),
    appFileService: createMockFileService(),
    appVersionService: createMockVersionService(),
    appBuildService: createMockBuildService(),
    onBack: () => console.log('Back'),
    onRun: (app) => console.log('Run:', app?.name),
  },
};

export const CustomUI = {
  args: {
    ...Default.args,
    ui: mergeDefaults(STUDIO_UI_DEFAULTS, {
      saveLabel: 'Guardar',
      buildLabel: 'Compilar',
      publishLabel: 'Publicar',
      previewLabel: 'Vista previa',
      runLabel: 'Ejecutar',
      unsavedLabel: 'Sin guardar',
      explorerTitle: 'Explorador',
      noFileOpen: 'Sin archivo abierto',
      noFileHint: 'Seleccione un archivo del explorador para comenzar',
      propertiesTitle: 'Propiedades',
      tabGeneral: 'General',
      tabManifest: 'Manifiesto',
      tabRoutes: 'Rutas',
      tabBuildOutput: 'Salida de compilación',
      tabProblems: 'Problemas',
      noBuildOutput: 'Sin salida aún. Haga clic en "Compilar" para compilar la app.',
      noProblems: 'Sin problemas detectados.',
    }),
  },
};

export const CustomTheme = {
  args: {
    ...Default.args,
    ui: mergeDefaults(STUDIO_UI_DEFAULTS, {
      theme: {
        background: '#0D1117',
        panelBackground: '#161B22',
        tabsBackground: '#0D1117',
        inputBackground: '#21262D',
        border: '#30363D',
        brandPrimary: '#58A6FF',
        brandPrimaryHover: '#388BFD',
        brandPrimaryHighlight: '#58A6FF20',
        brandPrimarySubtle: '#79C0FF',
        textPrimary: '#C9D1D9',
        textSecondary: '#8B949E',
        textMuted: '#484F58',
        success: '#3FB950',
        error: '#F85149',
        warning: '#D29922',
      },
    }),
  },
};

export const CustomEditorOptions = {
  args: {
    ...Default.args,
    ui: mergeDefaults(STUDIO_UI_DEFAULTS, {
      editorOptions: {
        fontSize: 16,
        tabSize: 4,
        minimap: { enabled: false },
        lineNumbers: 'off',
        wordWrap: 'off',
      },
    }),
  },
};

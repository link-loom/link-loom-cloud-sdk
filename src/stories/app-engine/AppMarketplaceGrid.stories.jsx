import React from 'react';
import AppMarketplaceGrid from '../../components/app-engine/marketplace/AppMarketplaceGrid.component';
import { MARKETPLACE_UI_DEFAULTS, mergeDefaults } from '../../components/app-engine/defaults/appEngine.defaults';

export default {
  title: 'App Engine/Marketplace/AppMarketplaceGrid',
  component: AppMarketplaceGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ui: { control: 'object' },
    className: { control: 'text' },
  },
};

const mockApps = [
  {
    id: 'app-001',
    name: 'Inventory Manager',
    slug: 'inventory-manager',
    description: 'Track inventory levels, shipments, and restocking across warehouses.',
    icon: '📦',
    category: 'Operations',
    manifest: { kind: 'workspace' },
  },
  {
    id: 'app-002',
    name: 'HR Portal',
    slug: 'hr-portal',
    description: 'Manage employee records, attendance and payroll processing.',
    icon: '👥',
    category: 'Human Resources',
    manifest: { kind: 'workspace' },
  },
  {
    id: 'app-003',
    name: 'Config Manager',
    slug: 'config-manager',
    description: 'System configuration and environment management utility.',
    icon: '⚙️',
    category: 'System',
    manifest: { kind: 'utility' },
  },
  {
    id: 'app-004',
    name: 'Report Generator',
    slug: 'report-generator',
    description: 'Generate and export operational reports.',
    icon: '📊',
    category: 'Analytics',
    manifest: { kind: 'utility' },
  },
];

const createMockService = (apps) => ({
  getAll: async () => ({ result: apps }),
});

const createMockPreferenceService = () => ({
  getByOrganization: async () => ({ result: [] }),
});

export const Default = {
  args: {
    appDefinitionService: createMockService(mockApps),
    appPreferenceService: createMockPreferenceService(),
    organizationId: 'org-001',
    onOpenApp: (app) => console.log('Open:', app.name),
    onEditApp: (app) => console.log('Edit:', app.name),
    onCreateApp: () => console.log('Create new app'),
    onDeleteApp: (app) => console.log('Delete:', app.name),
  },
};

export const CustomUI = {
  args: {
    appDefinitionService: createMockService(mockApps),
    appPreferenceService: createMockPreferenceService(),
    organizationId: 'org-001',
    ui: mergeDefaults(MARKETPLACE_UI_DEFAULTS, {
      title: 'Catálogo de Aplicaciones',
      subtitle: 'Explore, administre y lance sus apps',
      newAppLabel: 'Nueva App',
      searchPlaceholder: 'Buscar apps...',
      tabAll: 'Todas',
      tabWorkspaces: 'Espacios de trabajo',
      tabUtilities: 'Utilidades',
      noAppsSearch: 'Sin resultados',
      noAppsYet: 'Sin apps todavía',
      theme: {
        brandPrimary: '#FF5722',
        brandPrimaryHover: '#E64A19',
      },
    }),
    onOpenApp: (app) => console.log('Abrir:', app.name),
    onEditApp: (app) => console.log('Editar:', app.name),
    onCreateApp: () => console.log('Crear nueva app'),
  },
};

export const Containerless = {
  args: {
    appDefinitionService: createMockService(mockApps),
    appPreferenceService: createMockPreferenceService(),
    organizationId: 'org-001',
    ui: mergeDefaults(MARKETPLACE_UI_DEFAULTS, {
      containerless: true,
    }),
    onOpenApp: (app) => console.log('Open:', app.name),
    onEditApp: (app) => console.log('Edit:', app.name),
    onCreateApp: () => console.log('Create'),
  },
};

export const EmptyState = {
  args: {
    appDefinitionService: createMockService([]),
    appPreferenceService: createMockPreferenceService(),
    organizationId: 'org-001',
    onCreateApp: () => console.log('Create'),
  },
};

export const CustomEmptyState = {
  args: {
    appDefinitionService: createMockService([]),
    appPreferenceService: createMockPreferenceService(),
    organizationId: 'org-001',
    renderEmptyState: ({ searchQuery }) => (
      <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h3>{searchQuery ? `No results for "${searchQuery}"` : 'Nothing here yet'}</h3>
        <p>Get started by creating your first application.</p>
      </div>
    ),
    onCreateApp: () => console.log('Create'),
  },
};

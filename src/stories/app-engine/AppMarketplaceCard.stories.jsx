import React from 'react';
import AppMarketplaceCard from '../../components/app-engine/marketplace/AppMarketplaceCard.component';
import { MARKETPLACE_UI_DEFAULTS, mergeDefaults } from '../../components/app-engine/defaults/appEngine.defaults';

export default {
  title: 'App Engine/Marketplace/AppMarketplaceCard',
  component: AppMarketplaceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    ui: { control: 'object' },
    className: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

const sampleApp = {
  id: 'app-001',
  name: 'Inventory Manager',
  slug: 'inventory-manager',
  description: 'Track inventory levels, shipments, and restocking across warehouses.',
  icon: '📦',
  category: 'Operations',
  manifest: { kind: 'workspace', launcher_visible: true },
};

const samplePreference = {
  is_favorite: false,
  is_pinned: false,
};

export const Default = {
  args: {
    app: sampleApp,
    preference: samplePreference,
    onOpen: () => console.log('Open'),
    onEdit: () => console.log('Edit'),
    onDelete: () => console.log('Delete'),
  },
};

export const WithFavoriteAndPin = {
  args: {
    app: sampleApp,
    preference: { is_favorite: true, is_pinned: true },
    onOpen: () => console.log('Open'),
    onEdit: () => console.log('Edit'),
    onDelete: () => console.log('Delete'),
    onFavorite: () => console.log('Favorite toggled'),
    onPin: () => console.log('Pin toggled'),
  },
};

export const CustomUI = {
  args: {
    app: {
      ...sampleApp,
      name: 'Panel de Inventario',
      description: 'Seguimiento de inventario, envíos y reabastecimiento.',
    },
    preference: samplePreference,
    ui: mergeDefaults(MARKETPLACE_UI_DEFAULTS, {
      untitledApp: 'App sin título',
      noDescription: 'Sin descripción',
      menuOpen: 'Abrir',
      menuEdit: 'Editar en Studio',
      menuDelete: 'Eliminar',
      theme: {
        brandPrimary: '#FF5722',
        brandPrimaryHover: '#E64A19',
        deleteColor: '#D32F2F',
        hoverBorderColor: '#FF5722',
      },
    }),
    onOpen: () => console.log('Abrir'),
    onEdit: () => console.log('Editar'),
    onDelete: () => console.log('Eliminar'),
  },
};

export const CustomContainer = {
  args: {
    app: sampleApp,
    preference: samplePreference,
    renderContainer: ({ children, onClick }) => (
      <div
        onClick={onClick}
        style={{
          border: '2px dashed #7C3AED',
          borderRadius: '16px',
          padding: '16px',
          cursor: 'pointer',
          backgroundColor: '#1F1E26',
          color: '#EAEAF0',
        }}
      >
        {children}
      </div>
    ),
    onOpen: () => console.log('Open'),
    onEdit: () => console.log('Edit'),
  },
};

export const NoIcon = {
  args: {
    app: { ...sampleApp, icon: null, name: 'Untitled' },
    preference: samplePreference,
    onOpen: () => console.log('Open'),
  },
};

import React from 'react';
import AppRuntimeHost from '../../components/app-engine/runtime/AppRuntimeHost.component';
import { RUNTIME_UI_DEFAULTS, mergeDefaults } from '../../components/app-engine/defaults/appEngine.defaults';

export default {
  title: 'App Engine/Runtime/AppRuntimeHost',
  component: AppRuntimeHost,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ui: { control: 'object' },
    className: { control: 'text' },
    launchMode: {
      control: { type: 'select' },
      options: ['fullscreen', 'panel', 'modal'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '500px', border: '1px solid #333' }}>
        <Story />
      </div>
    ),
  ],
};

const createLoadingSessionService = () => ({
  openSession: () => new Promise(() => {}),
});

const createErrorSessionService = () => ({
  openSession: () => Promise.resolve({ error: 'App not found or no active version' }),
});

export const Loading = {
  args: {
    appSlug: 'inventory-manager',
    appSessionService: createLoadingSessionService(),
    apiBaseUrl: 'https://api.example.com',
  },
};

export const Error = {
  args: {
    appSlug: 'missing-app',
    appSessionService: createErrorSessionService(),
    apiBaseUrl: 'https://api.example.com',
  },
};

export const CustomUI = {
  args: {
    appSlug: 'inventory-manager',
    appSessionService: createLoadingSessionService(),
    apiBaseUrl: 'https://api.example.com',
    ui: mergeDefaults(RUNTIME_UI_DEFAULTS, {
      loadingText: 'Cargando aplicación...',
      errorTitle: 'Error al cargar la app',
      theme: {
        spinnerColor: '#FF5722',
        errorColor: '#D32F2F',
        textSecondary: '#B0BEC5',
      },
    }),
  },
};

export const CustomLoading = {
  args: {
    appSlug: 'inventory-manager',
    appSessionService: createLoadingSessionService(),
    apiBaseUrl: 'https://api.example.com',
    renderLoading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7C3AED' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ fontSize: '14px' }}>Initializing runtime environment...</p>
        </div>
      </div>
    ),
  },
};

export const CustomError = {
  args: {
    appSlug: 'missing-app',
    appSessionService: createErrorSessionService(),
    apiBaseUrl: 'https://api.example.com',
    renderError: ({ error }) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#EF4444' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h3 style={{ margin: '0 0 8px' }}>Something went wrong</h3>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{error || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #EF4444',
              backgroundColor: 'transparent',
              color: '#EF4444',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    ),
  },
};

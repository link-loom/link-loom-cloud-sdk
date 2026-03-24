// React Components
export { default as AppRuntimeHostComponent } from './components/app-engine/runtime/AppRuntimeHost.component';
export { default as AppStudioComponent } from './components/app-engine/studio/AppStudio.component';
export { default as AppMarketplaceGridComponent } from './components/app-engine/marketplace/AppMarketplaceGrid.component';
export { default as AppMarketplaceCardComponent } from './components/app-engine/marketplace/AppMarketplaceCard.component';

// Context + Hooks
export { AppEngineSDKProvider, useAppEngineSDK } from './features/app-engine/context/AppEngineSDK.context';
export { default as useAppStudio } from './features/app-engine/hooks/useAppStudio';
export { default as useAppRuntime } from './features/app-engine/hooks/useAppRuntime';

// Services
export { default as AppEngineAppDefinitionService } from './services/app-engine/app-definition/app-definition.service';
export { default as AppEngineAppVersionService } from './services/app-engine/app-version/app-version.service';
export { default as AppEngineAppFileService } from './services/app-engine/app-file/app-file.service';
export { default as AppEngineAppBuildService } from './services/app-engine/app-build/app-build.service';
export { default as AppEngineAppSessionService } from './services/app-engine/app-session/app-session.service';
export { default as AppEngineAppPreferenceService } from './services/app-engine/app-preference/app-preference.service';
export { default as AppEngineAppScaffoldService } from './services/app-engine/app-scaffold/app-scaffold.service';

// Adapters
export {
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
  deleteEntityRecord,
} from './services/utils/entityServiceAdapter';

// Shared UI Components + Utilities
export { default as PinnedAppsWidget } from './components/app-engine/PinnedAppsWidget.component';
export { default as DynamicMuiIcon } from './components/app-engine/DynamicMuiIcon.component';
export { getCategoryIcon, getCategoryTint } from './components/app-engine/categoryIcon.util';

// UI Defaults + Utilities
export {
  STUDIO_UI_DEFAULTS,
  MARKETPLACE_UI_DEFAULTS,
  RUNTIME_UI_DEFAULTS,
  mergeDefaults,
} from './components/app-engine/defaults/appEngine.defaults';

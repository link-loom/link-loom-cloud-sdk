// React Components
export { default as AppRuntimeHostComponent } from './components/app-engine/runtime/AppRuntimeHost.component';
export { default as AppStudioComponent } from './components/app-engine/studio/AppStudio.component';
export { default as AppMarketplaceGridComponent } from './components/app-engine/marketplace/AppMarketplaceGrid.component';
export { default as AppMarketplaceCardComponent } from './components/app-engine/marketplace/AppMarketplaceCard.component';

// Context + Hooks
export { AppEngineSDKProvider, useAppEngineSDK } from './features/app-engine/context/AppEngineSDK.context';
export { default as useAppStudio } from './features/app-engine/hooks/useAppStudio';
export { default as useAppRuntime } from './features/app-engine/hooks/useAppRuntime';

// App Engine Command Contributions — Command Center integration
export { default as useAppEngineCommandContributions } from './features/app-contributions/useAppEngineCommandContributions.hook';
export { compileContributionHandler } from './features/app-contributions/handler-compiler';
export { resolveIconByName as resolveContributionIcon } from './features/app-contributions/icon-resolver';

// App Engine Chain Contributions — cross-app output→input wiring
export { default as useAppEngineChainContributions } from './features/app-contributions/useAppEngineChainContributions.hook';
export { compileChainAppEmbed } from './features/app-contributions/chain-compiler';
export { dispatchEmbedToCommandCenter } from './features/app-contributions/command-center-dispatch';

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

// ── Support Components ────────────────────────────────────────────
export { default as SupportHubComponent } from './components/support/hub/SupportHub.component';
export { default as SupportIncidentsListComponent } from './components/support/incidents/SupportIncidentsList.component';
export { default as SupportGuideDetailComponent } from './components/support/guides/SupportGuideDetail.component';
export { default as SupportCaseFormComponent } from './components/support/case-form/SupportCaseForm.component';
export { default as SupportCaseListComponent } from './components/support/cases/SupportCaseList.component';
export { default as SupportCaseDetailComponent } from './components/support/cases/SupportCaseDetail.component';
export { default as SupportAssistantPanelComponent } from './components/support/assistant/SupportAssistantPanel.component';
export { default as SupportIncidentBannerComponent } from './components/support/incidents/SupportIncidentBanner.component';
export { default as SupportCategoryGridComponent } from './components/support/categories/SupportCategoryGrid.component';
export { default as SupportAllCategoriesComponent } from './components/support/categories/SupportAllCategories.component';
export { default as SupportStatusBadgeComponent } from './components/support/shared/SupportStatusBadge.component';
export { default as SupportSeverityBadgeComponent } from './components/support/shared/SupportSeverityBadge.component';
export { default as SupportEmptyStateComponent } from './components/support/shared/SupportEmptyState.component';
export { default as SupportTimelineBlockComponent } from './components/support/timeline/SupportTimelineBlock.component';
export { default as SupportResponseComposerComponent } from './components/support/timeline/SupportResponseComposer.component';

// Support UI Defaults
export {
  SUPPORT_THEME,
  SUPPORT_HUB_DEFAULTS,
  SUPPORT_CASE_FORM_DEFAULTS,
  SUPPORT_CASE_LIST_DEFAULTS,
  SUPPORT_CASE_DETAIL_DEFAULTS,
  SUPPORT_ASSISTANT_DEFAULTS,
  SUPPORT_INCIDENT_BANNER_DEFAULTS,
  SUPPORT_CATEGORY_GRID_DEFAULTS,
  STATUS_CONFIG,
  SEVERITY_CONFIG,
  PRIORITY_CONFIG,
} from './components/support/defaults/support.defaults';

// Support Context + Hook
export { SupportSDKProvider, useSupportSDK } from './features/support/context/SupportSDK.context';

// Support Services
export { default as SupportNamespaceService } from './services/support/support-namespace/support-namespace.service';
export { default as SupportIssueCategoryService } from './services/support/support-issue-category/support-issue-category.service';
export { default as SupportCaseService } from './services/support/support-case/support-case.service';
export { default as SupportCaseMessageService } from './services/support/support-case-message/support-case-message.service';
export { default as SupportIncidentService } from './services/support/support-incident/support-incident.service';
export { default as SupportQuickGuideService } from './services/support/support-quick-guide/support-quick-guide.service';

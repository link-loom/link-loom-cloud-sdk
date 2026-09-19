// React Components
export { default as AppRuntimeHostComponent } from './components/app-engine/runtime/AppRuntimeHost.component';
export { default as AppStudioComponent } from './components/app-engine/studio/AppStudio.component';
export { default as AppMarketplaceGridComponent } from './components/app-engine/marketplace/AppMarketplaceGrid.component';
export { default as AppMarketplaceCardComponent } from './components/app-engine/marketplace/AppMarketplaceCard.component';

// Context + Hooks
export { AppEngineSDKProvider, useAppEngineSDK } from './features/app-engine/context/AppEngineSDK.context';
export { default as useAppStudio } from './features/app-engine/hooks/useAppStudio';
export { default as useAppRuntime } from './features/app-engine/hooks/useAppRuntime';

// App Engine runtime — identity, offline data, files, directory, notifications and app kit hooks
export { default as AppIcon } from './components/app-engine/AppIcon.component';
export {
  default as AppNotificationsBridge,
  APP_NOTIFICATION_EVENT,
  APP_NOTIFICATION_OPEN_EVENT,
  APP_NOTIFICATION_ACTION_EVENT,
  requestDesktopNotificationPermission,
  useDesktopNotificationPermission,
} from './components/app-engine/notifications/AppNotificationsBridge.component';
export {
  CALENDAR_REMINDER_SIGNAL,
  notificationSignalNames,
  signalToNotification,
  buildAppRuntimeDeepLink,
} from './components/app-engine/notifications/app-notification-signals';
export { default as VeripassLogo } from './components/app-engine/runtime/identity/VeripassLogo.component';
export { clearAppDataCache, VERIPASS_LOGOUT_EVENT } from './features/app-engine/runtime/data/data-cache';
export { default as AppDataClient } from './features/app-engine/runtime/data/data-client';
export { applyPatchOperations, validatePatchOperations, PATCH_OPERATIONS } from './features/app-engine/runtime/data/data-patch';
export { createLoomIdentityHeaders } from './features/app-engine/runtime/shared/loom-identity.client';
export {
  RUNTIME_MODULE_LOADERS,
  STATIC_RUNTIME_MODULES,
  ensureRuntimeModules,
} from './components/app-engine/runtime/runtime-modules/runtime-modules.registry';
export { default as useAppData } from './features/app-engine/hooks/useAppData';
export { default as useAutosave } from './features/app-engine/hooks/useAutosave';
export { default as useRecents } from './features/app-engine/hooks/useRecents';
export { default as useAppSettings } from './features/app-engine/hooks/useAppSettings';
export { default as useConnectivity } from './features/app-engine/hooks/useConnectivity';
export { default as usePresence } from './features/app-engine/hooks/usePresence';
export { default as useStorageUsage } from './features/app-engine/hooks/useStorageUsage';

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

// ── Signals — realtime one-way event engine (send + receive) ──────
export { default as BaseSignalStream } from './streams/base/base-signal-stream';
export { default as SignalStream } from './streams/communication/signal/signal-stream';
export { default as useSignals } from './hooks/useSignals';
export { default as SignalConsumer } from './consumers/signal-consumer';
export { default as SignalPublisher } from './publishers/signal-publisher';

// ── Event Bus — durable messaging engine (topics, consumer groups, offsets) ──
export { default as EventBusProducer } from './communication/event-bus/producer';
export { default as EventBusConsumer } from './communication/event-bus/consumer';
export { default as useEventBus } from './communication/event-bus/use-event-bus';

// ── Monetization — products, plans, subscriptions and usage ─────────────────
// The catalog and metering clients are framework-agnostic on purpose: most sites that render pricing
// are static builds, so they use the global fetch and take every setting from their constructor.
export { default as PricingCatalogClient } from './monetization/catalog/catalog-client';
export { default as MeteringClient } from './monetization/metering/metering-client';
export { QuotaExceededError } from './monetization/metering/metering-client';
export { default as usePricingCatalog } from './monetization/catalog/use-pricing-catalog';
export { default as useMetering } from './monetization/metering/use-metering';
export { default as useEntitlement } from './monetization/metering/use-entitlement';
export { default as useUsage } from './monetization/hooks/use-usage';
export { default as useBilling } from './monetization/hooks/use-billing';
export { default as useInvoices } from './monetization/hooks/use-invoices';
export { default as useBillingProfile } from './monetization/hooks/use-billing-profile';
export { default as useBillingAccess } from './monetization/hooks/use-billing-access';
export {
  formatPrice,
  formatCyclePrice,
  formatUsage,
  usagePercentage,
  formatPeriod,
  formatMoney,
  formatDate,
  formatDateRange,
  formatCountry,
} from './monetization/format/value-formatter';
export { default as PricingTableComponent } from './monetization/components/pricing-table/PricingTable.component';
export { default as PricingPlanCardComponent } from './monetization/components/pricing-table/PricingPlanCard.component';
export { default as BillingSummaryComponent } from './monetization/components/billing/BillingSummary.component';
export { default as UsagePanelComponent } from './monetization/components/billing/UsagePanel.component';
export { default as BillingCenterComponent, BILLING_SECTION_IDS } from './monetization/components/billing/center/BillingCenter.component';
export { default as BillingAccessGateComponent } from './monetization/components/billing/access-gate/BillingAccessGate.component';
// `mergeDefaults` is intentionally not re-exported here: App Engine already exports a helper by that
// name, and two of them at the package root would collide. Hosts override copy through the `labels`
// and `theme` props rather than merging by hand.
export {
  MONETIZATION_THEME,
  PRICING_TABLE_DEFAULTS,
  BILLING_SUMMARY_DEFAULTS,
  BILLING_CENTER_DEFAULTS,
  BILLING_ACCESS_DEFAULTS,
  BILLING_SUMMARY_TRANSLATIONS,
  BILLING_CENTER_TRANSLATIONS,
  BILLING_ACCESS_TRANSLATIONS,
  TAX_ID_TYPES_BY_COUNTRY,
} from './monetization/defaults/monetization.defaults';
export { default as PlatformProductService } from './monetization/services/product/product.service';
export { default as MonetizationFeatureService } from './monetization/services/feature/feature.service';
export { default as MonetizationPlanService } from './monetization/services/plan/plan.service';
export { default as MonetizationPlanVersionService } from './monetization/services/plan-version/plan-version.service';
export { default as MonetizationPlanCatalogService } from './monetization/services/plan-catalog/plan-catalog.service';
export { default as MonetizationSubscriptionService } from './monetization/services/subscription/subscription.service';
export { default as MonetizationUsageCounterService } from './monetization/services/usage-counter/usage-counter.service';
export { default as MonetizationBillingRecordService } from './monetization/services/billing-record/billing-record.service';
export { default as MonetizationBillingService } from './monetization/services/billing/billing.service';

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

// Forms Services
export { default as FormsSubmissionService } from './services/forms/form-submission/form-submission.service';

// Support Services
export { default as SupportNamespaceService } from './services/support/support-namespace/support-namespace.service';
export { default as SupportIssueCategoryService } from './services/support/support-issue-category/support-issue-category.service';
export { default as SupportCaseService } from './services/support/support-case/support-case.service';
export { default as SupportCaseMessageService } from './services/support/support-case-message/support-case-message.service';
export { default as SupportIncidentService } from './services/support/support-incident/support-incident.service';
export { default as SupportQuickGuideService } from './services/support/support-quick-guide/support-quick-guide.service';

// Storage — Finder-style browser (operator console and user Files) and its client
export { default as StorageBrowser, STORAGE_VIEWS } from './components/storage/browser/StorageBrowser.component';
export { STORAGE_BROWSER_LABELS } from './components/storage/defaults/storage.labels';
export { formatFileSize } from './components/storage/shared/storage.helpers';
// What a person may do with one object — the rules every file surface reads instead of inventing.
export { storageCapabilities, selectionCapabilities, STORAGE_VERBS } from './components/storage/shared/storage.capabilities';
export { default as StorageShareDialog } from './components/storage/dialogs/StorageShareDialog.component';
export { default as StorageNameDialog } from './components/storage/dialogs/StorageNameDialog.component';
export { default as StorageMoveDialog } from './components/storage/dialogs/StorageMoveDialog.component';
export { default as StorageDeleteDialog } from './components/storage/dialogs/StorageDeleteDialog.component';
export { default as StorageObjectService } from './services/storage/storage-object/storage-object.service';
export { default as FilePickerDialog, FILE_PICKER_LABELS } from './components/storage/picker/FilePickerDialog.component';
export { createEmojiPicker, EMOJI_DATA } from './components/emoji/emoji-picker.client';

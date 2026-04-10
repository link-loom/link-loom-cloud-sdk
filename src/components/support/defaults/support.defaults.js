// ── Support UI Defaults ─────────────────────────────────────────────
// Follows Veripass contract pattern: all visual customization inside
// a `ui` prop, with `theme` nested inside `ui.theme`.
// Text labels live directly in `ui` (not in a nested labels object).
// Consumers override selectively via spread + merge.

import { mergeDefaults } from '../../app-engine/defaults/appEngine.defaults';

export { mergeDefaults };

// ── Theme Constants (Editorial Operations Design System) ───────────

import { SUPPORT_THEME } from './support.theme';
export { SUPPORT_THEME };

// ── Support Hub Defaults ───────────────────────────────────────────

export const SUPPORT_HUB_DEFAULTS = {
  // Labels
  title: 'Support Hub',
  subtitle: 'Get help with configuration, operations, and troubleshooting. Access tailored resources and expert assistance.',
  incidentBannerLabel: 'Active Incidents',
  immediateActionsTitle: 'IMMEDIATE ACTIONS',
  commonCategoriesTitle: 'COMMON CATEGORIES',
  assistantCardTitle: 'Ask the Support Assistant',
  assistantCardDescription: 'Get instant help with guided diagnostics and troubleshooting',
  assistantCardAction: 'Start Conversation',
  recentActivityTitle: 'RECENT ACTIVITY',
  noRecentActivity: 'No recent activity',

  // Quick actions
  quickActions: [
    { key: 'report-issue', icon: 'ReportProblem', label: 'Report an issue', description: 'Submit a new support case' },
    { key: 'request-help', icon: 'HelpOutline', label: 'Request help', description: 'Get assistance from the team' },
    { key: 'view-incidents', icon: 'Warning', label: 'View incidents', description: 'Check active service incidents' },
    { key: 'ask-assistant', icon: 'SmartToy', label: 'Ask support assistant', description: 'AI-guided troubleshooting' },
  ],

  // Layout
  containerless: false,

  // Theme (nested)
  theme: { ...SUPPORT_THEME },
};

// ── Support Case Form Defaults ─────────────────────────────────────

export const SUPPORT_CASE_FORM_DEFAULTS = {
  // Labels
  title: 'Report an Issue',
  subtitle: 'Provide details about the issue you are experiencing',
  classificationLabel: 'Problem Classification',
  classificationPlaceholder: 'Select a category...',
  summaryLabel: 'Issue Summary',
  summaryPlaceholder: 'Brief description of the issue',
  detailsLabel: 'Issue Details',
  detailsPlaceholder: 'Provide a detailed description of what happened, steps to reproduce, and expected behavior...',
  severityLabel: 'Severity Level',
  businessImpactLabel: 'Business Impact',
  businessImpactPlaceholder: 'Describe how this issue affects your operations...',
  attachmentsLabel: 'Attachments',
  attachmentsHint: 'Drag files here or click to browse',
  submitLabel: 'Submit Support Case',
  diagnosticsTitle: 'Diagnostics Summary',
  relatedKbTitle: 'Related Knowledge Base',
  noRelatedKb: 'No related articles found',

  // Severity options
  severityOptions: [
    { value: 'low', label: 'Low', color: '#2B6CB0' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#f97316' },
    { value: 'critical', label: 'Critical', color: '#9f403d' },
  ],

  // Theme (nested)
  theme: { ...SUPPORT_THEME },
};

// ── Support Case List Defaults ─────────────────────────────────────

export const SUPPORT_CASE_LIST_DEFAULTS = {
  // Labels
  title: 'Support Cases',
  subtitle: 'Here you can see, track and manage your support cases',
  exportLabel: 'Export Records',
  createCaseLabel: 'Open a Support Case',
  searchPlaceholder: 'Search cases...',
  filterAllProducts: 'All Products',
  filterStatus: 'Status',
  filterPriority: 'Priority',
  tabAll: 'All Cases',
  tabOpen: 'Open',
  tabPending: 'Pending',
  tabResolved: 'Resolved',
  noCases: 'No support cases found',
  noCasesHint: 'Open a support case to get started',

  // Table headers
  headerCaseId: 'Case ID',
  headerTitle: 'Title',
  headerProduct: 'Product',
  headerStatus: 'Status',
  headerPriority: 'Priority',
  headerCreated: 'Created',
  headerLastUpdate: 'Last Update',

  // Pagination
  rowsPerPage: 10,

  // Theme (nested)
  theme: { ...SUPPORT_THEME },
};

// ── Support Case Detail Defaults ───────────────────────────────────

export const SUPPORT_CASE_DETAIL_DEFAULTS = {
  // Labels
  breadcrumbRoot: 'Support Cases',
  escalateLabel: 'Escalate Case',
  resolveLabel: 'Resolve Case',
  caseInfoTitle: 'Case Information',
  diagnosticsTitle: 'Diagnostics Context',
  internalResourcesTitle: 'Internal Resources',
  responseTitle: 'Add a response',
  responsePlaceholder: 'Type your response...',
  attachDiagnosticsLabel: 'Attach Diagnostics',
  postResponseLabel: 'Post Response',

  // Info labels
  labelProduct: 'Product',
  labelPriority: 'Priority',
  labelSeverity: 'Severity',
  labelModule: 'Module',
  labelAccount: 'Account',
  labelBrowser: 'Browser',
  labelEnvironment: 'Environment',
  labelOs: 'OS',
  labelRegion: 'Region',

  // Timeline labels
  updateMetadataLabel: 'Update Case Metadata',
  caseCreatedLabel: 'Case Created',
  diagnosticsAttachedLabel: 'Diagnostics Attached',
  viewAnalysisLabel: 'View Analysis',

  // Theme (nested)
  theme: { ...SUPPORT_THEME },
};

// ── Support Assistant Defaults ─────────────────────────────────────

export const SUPPORT_ASSISTANT_DEFAULTS = {
  // Labels
  title: 'Support Assistant',
  subtitle: 'Guided help based on your current context',
  sessionContextTitle: 'Session Context',
  diagnosticsTitle: 'Diagnostics',
  diagnosticsReady: 'Ready',
  diagnosticsBundle: 'Logs & Stack Trace Attached',
  viewBundleLabel: 'View Bundle',
  escalationTitle: 'Need more help?',
  escalationDescription: 'Create a support case with full diagnostics attached',
  escalationAction: 'Escalate to Support',
  inputPlaceholder: 'Describe your issue or ask a question...',
  sendLabel: 'Send Message',
  systemGreeting: 'Hello! I am your support assistant. I can help you diagnose issues, find solutions, and escalate to the support team when needed. What can I help you with?',

  // Suggested actions
  suggestedActions: [
    { key: 'diagnose', label: 'Run diagnostics' },
    { key: 'recent-errors', label: 'Show recent errors' },
    { key: 'known-issues', label: 'Check known issues' },
  ],

  // Theme (nested)
  theme: { ...SUPPORT_THEME },
};

// ── Incident Banner Defaults ───────────────────────────────────────

export const SUPPORT_INCIDENT_BANNER_DEFAULTS = {
  noIncidentsLabel: 'No active incidents',
  noIncidentsSubtitle: 'All systems are operating within normal parameters.',
  activeIncidentsLabel: 'Active Incidents',
  viewDetailsLabel: 'View Details',
  theme: { ...SUPPORT_THEME },
};

// ── Category Grid Defaults ─────────────────────────────────────────

export const SUPPORT_CATEGORY_GRID_DEFAULTS = {
  startCaseLabel: 'Start Case',
  gridColumnClass: 'col-12 col-sm-6 col-lg-4',
  theme: { ...SUPPORT_THEME },
};

// ── Status + Severity Maps ─────────────────────────────────────────

export const STATUS_CONFIG = {
  open: { label: 'Open', color: '#3b82f6', bg: '#eff6ff' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
  pending: { label: 'Pending', color: '#8b5cf6', bg: '#f5f3ff' },
  resolved: { label: 'Resolved', color: '#22c55e', bg: '#f0fdf4' },
  closed: { label: 'Closed', color: '#6B7280', bg: '#f9fafb' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
  deleted: { label: 'Deleted', color: '#9CA3AF', bg: '#f3f4f6' },
};

// Statuses that end users are allowed to set on their own cases.
// Internal transitions (open, in_progress, pending, resolved, closed, deleted)
// are handled by support staff or by explicit action buttons (Resolve / Close / Delete).
export const USER_SELECTABLE_STATUSES = ['resolved', 'closed', 'deleted'];

export const SEVERITY_CONFIG = {
  low: { label: 'Low', color: '#3b82f6', bg: '#eff6ff' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  high: { label: 'High', color: '#f97316', bg: '#fff7ed' },
  critical: { label: 'Critical', color: '#ef4444', bg: '#fef2f2' },
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#3b82f6', bg: '#eff6ff' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  high: { label: 'High', color: '#f97316', bg: '#fff7ed' },
  urgent: { label: 'Urgent', color: '#ef4444', bg: '#fef2f2' },
};

// The routes of the support center and the actions its sub-pages raise. The Link Loom support
// components never navigate: they raise `link-loom-support::*` actions through `itemOnAction`, and the
// center maps each one to a route here and to the effect it has on the center's own state.

export const SUPPORT_SEGMENTS = Object.freeze({
  hub: "hub",
  cases: "cases",
  newCase: "new-case",
  case: "case",
  assistant: "assistant",
  incidents: "incidents",
  guide: "guide",
  categories: "categories",
});

/** The ids a host's `renderBridge` receives: one per sub-page of the center. */
export const SUPPORT_SUB_PAGES = Object.freeze({
  HUB: "hub",
  CASES: "cases",
  NEW_CASE: "new-case",
  CASE_DETAIL: "case-detail",
  ASSISTANT: "assistant",
  INCIDENTS: "incidents",
  GUIDE_DETAIL: "guide-detail",
  CATEGORIES: "categories",
});

export const SUPPORT_ACTIONS = Object.freeze({
  REPORT_ISSUE: "link-loom-support::report-issue",
  REQUEST_HELP: "link-loom-support::request-help",
  BROWSE_ALL_CATEGORIES: "link-loom-support::browse-all-categories",
  CATEGORY_SELECT: "link-loom-support::category-select",
  VIEW_INCIDENTS: "link-loom-support::view-incidents",
  ASK_ASSISTANT: "link-loom-support::ask-assistant",
  ASSISTANT_OPEN: "link-loom-support::assistant-open",
  CASE_CREATE: "link-loom-support::case-create",
  CASE_CLICK: "link-loom-support::case-click",
  CASE_VIEW: "link-loom-support::case-view",
  CASE_UPDATE_STATUS: "link-loom-support::case-update-status",
  CASE_RESOLVE: "link-loom-support::case-resolve",
  CASE_CLOSE: "link-loom-support::case-close",
  CASE_DELETE: "link-loom-support::case-delete",
  CASE_REPLY: "link-loom-support::case-reply",
  CASE_UPDATE_METADATA: "link-loom-support::case-update-metadata",
  VIEW_ALL_CASES: "link-loom-support::view-all-cases",
  BACK_TO_HUB: "link-loom-support::back-to-hub",
  ASSISTANT_ESCALATE: "link-loom-support::assistant-escalate",
  DIAGNOSTICS_VIEW: "link-loom-support::diagnostics-view",
  VIEW_STATUS_PAGE: "link-loom-support::view-status-page",
  INCIDENT_VIEW: "link-loom-support::incident-view",
  GUIDE_CLICK: "link-loom-support::guide-click",
  GUIDE_LIST: "link-loom-support::guide-list",
});

const NEW_CASE = `/${SUPPORT_SEGMENTS.newCase}`;
const CASES = `/${SUPPORT_SEGMENTS.cases}`;
const ASSISTANT = `/${SUPPORT_SEGMENTS.assistant}`;
const HUB = `/${SUPPORT_SEGMENTS.hub}`;

const FIXED_ROUTES = {
  [SUPPORT_ACTIONS.REPORT_ISSUE]: NEW_CASE,
  [SUPPORT_ACTIONS.REQUEST_HELP]: NEW_CASE,
  [SUPPORT_ACTIONS.CATEGORY_SELECT]: NEW_CASE,
  [SUPPORT_ACTIONS.ASSISTANT_ESCALATE]: NEW_CASE,
  [SUPPORT_ACTIONS.BROWSE_ALL_CATEGORIES]: `/${SUPPORT_SEGMENTS.categories}`,
  [SUPPORT_ACTIONS.VIEW_INCIDENTS]: CASES,
  [SUPPORT_ACTIONS.VIEW_ALL_CASES]: CASES,
  [SUPPORT_ACTIONS.VIEW_STATUS_PAGE]: CASES,
  [SUPPORT_ACTIONS.INCIDENT_VIEW]: CASES,
  [SUPPORT_ACTIONS.ASK_ASSISTANT]: ASSISTANT,
  [SUPPORT_ACTIONS.ASSISTANT_OPEN]: ASSISTANT,
  [SUPPORT_ACTIONS.GUIDE_LIST]: HUB,
  [SUPPORT_ACTIONS.BACK_TO_HUB]: HUB,
};

const caseRoute = (payload) => `/${SUPPORT_SEGMENTS.case}/${payload?.supportCase?.id}`;

const PAYLOAD_ROUTES = {
  [SUPPORT_ACTIONS.CASE_CLICK]: caseRoute,
  [SUPPORT_ACTIONS.CASE_VIEW]: caseRoute,
  [SUPPORT_ACTIONS.GUIDE_CLICK]: (payload) => `/${SUPPORT_SEGMENTS.guide}/${payload?.guide?.slug}`,
};

/**
 * Where an action takes the person, relative to the center's base path (`/new-case`), or `null` for an
 * action that stays on the page or is not one of the center's.
 */
export const resolveActionRoute = (action, payload) => FIXED_ROUTES[action] ?? PAYLOAD_ROUTES[action]?.(payload) ?? null;

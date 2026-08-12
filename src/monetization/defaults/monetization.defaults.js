/**
 * Customer-facing copy and colours for the pricing and billing surfaces.
 *
 * Everything here is what a CUSTOMER reads. None of the operator vocabulary belongs in this file — a
 * customer should never see the words "version", "stamped" or "entitlement" on a pricing card.
 *
 * A host overrides any of it through the `labels` and `theme` props, which is how one implementation
 * serves several products without forking.
 */
export const PRICING_TABLE_DEFAULTS = {
  currentPlanLabel: "Your current plan",
  selectLabel: "Choose this plan",
  contactLabel: "Talk to us",
  loadingLabel: "Loading plans…",
  emptyLabel: "No plans are available right now.",
  featuresLabel: "What you get",
  showAllFeaturesLabel: "Show everything included",
  showFewerFeaturesLabel: "Show less",
  faqTitle: "Common questions",
};

export const BILLING_SUMMARY_DEFAULTS = {
  planTitle: "Your plan",
  usageTitle: "What you have used",
  historyTitle: "Past periods",
  noSubscriptionTitle: "No plan yet",
  noSubscriptionBody: "Choose a plan to get started.",
  loadingLabel: "Loading…",
  periodLabel: "This period",
  renewsLabel: "Renews",
  unlimitedLabel: "Unlimited",
  overLimitLabel: "Over the limit",
  approachingLabel: "Close to the limit",
  changePlanLabel: "Change plan",
  amountLabel: "Amount",
  emptyHistoryLabel: "Nothing here yet.",
};

export const MONETIZATION_THEME = {
  brandPrimary: "#2A317B",
  brandPrimaryDark: "#1F2559",
  accent: "#25BDD6",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#c62828",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  surface: "#ffffff",
  surfaceMuted: "#f9fafb",
  surfaceToggle: "#e2e4e8",
  border: "#e5e7eb",
  borderDashed: "#d1d5db",
};

/**
 * Merge a host's overrides over the defaults, one level deep.
 *
 * Shallow on purpose: these are flat maps of strings and colours, and a deep merge would only make
 * it harder to reason about which value won.
 */
export function mergeDefaults(defaults, overrides) {
  if (!overrides) {
    return defaults;
  }

  return { ...defaults, ...overrides };
}

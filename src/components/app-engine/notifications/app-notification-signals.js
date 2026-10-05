// Server-side notifications for the host: signals on `user:{veripass_identity}` that become app
// notifications. `calendar.reminder` (scheduled by calendar apps) and `<app_slug>.notify` carry
// `{ title, body, deepLink, severity, tag }`; anything else is ignored.

export const CALENDAR_REMINDER_SIGNAL = "calendar.reminder";
export const CALENDAR_APP_SLUG = "stoneos-calendar";
export const APP_RUNTIME_BASE_PATH = "/client/app-engine/runtime";

const NOTIFY_SUFFIX = ".notify";
const SEVERITIES = ["info", "success", "warning", "error"];

export const notificationSignalNames = (appSlugs = []) => [
  CALENDAR_REMINDER_SIGNAL,
  ...[...new Set(appSlugs.filter(Boolean))].map((appSlug) => `${appSlug}${NOTIFY_SUFFIX}`),
];

const appSlugOfSignal = (signalName, payload) => {
  if (signalName === CALENDAR_REMINDER_SIGNAL) {
    return payload.appSlug || payload.app_slug || CALENDAR_APP_SLUG;
  }
  if (signalName.endsWith(NOTIFY_SUFFIX) && signalName.length > NOTIFY_SUFFIX.length) {
    return signalName.slice(0, -NOTIFY_SUFFIX.length);
  }
  return null;
};

// A `.` or `..` segment (also percent-encoded) would climb out of the app once the host joins the path
// to the app's runtime route.
const DOT_SEGMENT = /(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i;

/**
 * A path inside an app, as a deep link carries it: one leading slash, never an address of another
 * site, no backslashes or whitespace and no dot segments, so that joining it to the app's route can
 * only land inside the app.
 */
export const isAppPath = (value) =>
  typeof value === "string" && /^\/(?!\/)[^\s\\]*$/.test(value) && !DOT_SEGMENT.test(value.split(/[?#]/)[0]);

// The text in the language of the person (`titles` / `bodies` carry one per language), else the default.
const localized = ({ text, texts, locale }) => {
  const localizedText = locale && texts && typeof texts === "object" ? texts[locale] : null;

  if (typeof localizedText === "string" && localizedText.trim()) {
    return localizedText;
  }

  return typeof text === "string" ? text : "";
};

// The detail of an `stoneos::app-notification` event, or null when the signal is not a notification.
// `locale` picks the text of the person's language; `organizationId` is the organization the host is in:
// a notice about another one is not for this window (the same person can be in two organizations).
export const signalToNotification = (signalName, payload, { locale, organizationId } = {}) => {
  if (!payload || typeof payload !== "object" || typeof payload.title !== "string" || !payload.title.trim()) {
    return null;
  }

  const appSlug = appSlugOfSignal(String(signalName || ""), payload);
  if (!appSlug) {
    return null;
  }

  const noticeOrganization = payload.organizationId || payload.organization_id;
  if (noticeOrganization && organizationId && noticeOrganization !== organizationId) {
    return null;
  }

  const deepLink = isAppPath(payload.deepLink) ? payload.deepLink : null;

  return {
    appSlug,
    title: localized({ text: payload.title, texts: payload.titles, locale }),
    body: localized({ text: payload.body, texts: payload.bodies, locale }),
    deepLink,
    severity: SEVERITIES.includes(payload.severity) ? payload.severity : "info",
    tag: typeof payload.tag === "string" && payload.tag ? payload.tag : null,
  };
};

// Where a host navigates on `stoneos::app-notification-open`: the app runtime route plus the deep link.
export const buildAppRuntimeDeepLink = ({ appSlug, deepLink }, basePath = APP_RUNTIME_BASE_PATH) =>
  `${basePath}/${encodeURIComponent(appSlug)}${deepLink || ""}`;

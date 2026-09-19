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

// The detail of an `stoneos::app-notification` event, or null when the signal is not a notification.
export const signalToNotification = (signalName, payload) => {
  if (!payload || typeof payload !== "object" || typeof payload.title !== "string" || !payload.title.trim()) {
    return null;
  }

  const appSlug = appSlugOfSignal(String(signalName || ""), payload);
  if (!appSlug) {
    return null;
  }

  const deepLink = typeof payload.deepLink === "string" && payload.deepLink.startsWith("/") ? payload.deepLink : null;

  return {
    appSlug,
    title: payload.title,
    body: typeof payload.body === "string" ? payload.body : "",
    deepLink,
    severity: SEVERITIES.includes(payload.severity) ? payload.severity : "info",
    tag: typeof payload.tag === "string" ? payload.tag : null,
  };
};

// Where a host navigates on `stoneos::app-notification-open`: the app runtime route plus the deep link.
export const buildAppRuntimeDeepLink = ({ appSlug, deepLink }, basePath = APP_RUNTIME_BASE_PATH) =>
  `${basePath}/${encodeURIComponent(appSlug)}${deepLink || ""}`;

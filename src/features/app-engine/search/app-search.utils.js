import {
  APP_RUNTIME_BASE_PATH,
  buildAppRuntimeDeepLink,
  isAppPath,
} from "../../../components/app-engine/notifications/app-notification-signals";

/**
 * Where a result opens, given the root of its app in the host (`/client/app-engine/runtime/<app>`):
 * that root plus the path inside the app, which opens the record with its context. Null when the
 * result has no valid path, so a malformed answer never navigates anywhere.
 */
export const hitPathInApp = (hit, appRoot) => (isAppPath(hit?.deep_link) ? `${appRoot}${hit.deep_link}` : null);

/**
 * The same, for a host that mounts apps under the default runtime route
 * (`/client/app-engine/runtime/<app><path>`) or under its own `basePath`.
 */
export const hitRuntimePath = (hit, basePath = APP_RUNTIME_BASE_PATH) => {
  if (!hit?.app_slug) {
    return null;
  }

  return hitPathInApp(hit, buildAppRuntimeDeepLink({ appSlug: hit.app_slug }, basePath));
};

/** What kind of record a result is, in the person's language, falling back to the default text. */
export const hitEntityLabel = (hit, locale) => hit?.entity_labels?.[locale] || hit?.entity_label || "";

/** Unique across apps and entities, so two results with the same title are told apart. */
export const hitKey = (hit) => `${hit?.app_slug}:${hit?.entity_type}:${hit?.id}`;

/** The right-hand line of a result: its app, the kind of record and, when it has one, its status. */
export const hitContextLine = (hit, locale) =>
  [hit?.app_name, hitEntityLabel(hit, locale), hit?.status?.title].filter(Boolean).join(" · ");

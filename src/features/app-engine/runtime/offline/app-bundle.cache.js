export const APP_BUNDLE_CACHE_NAME = "stoneos-app-bundles";
const BUNDLE_INDEX_KEY = "stoneos:app-bundles:index";
const SESSION_QUEUE_PREFIX = "stoneos:app-session-queue:";

const bundleRequestUrl = (appVersionId) => `/__stoneos/app-bundles/${encodeURIComponent(appVersionId)}`;

const readJson = (key) => {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(key)) || null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full: the offline copy is best effort.
  }
};

const isCacheStorageAvailable = () => typeof caches !== "undefined";

// Keeps the full session-open payload (definition, version and build artifact) per app version.
export const storeAppBundle = async (appSlug, openPayload) => {
  const appVersionId = openPayload?.app_version?.id || openPayload?.session?.app_version_id;
  if (!appSlug || !appVersionId || !isCacheStorageAvailable()) {
    return;
  }

  try {
    const cache = await caches.open(APP_BUNDLE_CACHE_NAME);
    const index = readJson(BUNDLE_INDEX_KEY) || {};
    const alreadyCached = index[appSlug] === appVersionId && (await cache.match(bundleRequestUrl(appVersionId)));

    if (!alreadyCached) {
      await cache.put(
        bundleRequestUrl(appVersionId),
        new Response(JSON.stringify(openPayload), { headers: { "Content-Type": "application/json" } }),
      );
    }

    const previousVersionId = index[appSlug];
    writeJson(BUNDLE_INDEX_KEY, { ...index, [appSlug]: appVersionId });

    if (previousVersionId && previousVersionId !== appVersionId) {
      await cache.delete(bundleRequestUrl(previousVersionId));
    }
  } catch (error) {
    console.error("[AppRuntimeHost] Failed to cache app bundle", error);
  }
};

export const loadCachedAppBundle = async (appSlug) => {
  const appVersionId = readJson(BUNDLE_INDEX_KEY)?.[appSlug];
  if (!appVersionId || !isCacheStorageAvailable()) {
    return null;
  }

  try {
    const cache = await caches.open(APP_BUNDLE_CACHE_NAME);
    const response = await cache.match(bundleRequestUrl(appVersionId));
    return response ? response.json() : null;
  } catch {
    return null;
  }
};

export const isOfflineSessionId = (sessionId) => typeof sessionId === "string" && sessionId.startsWith("offline-");

// Session writes made while offline keep only the latest value per kind and are replayed against
// the next real session of the same app.
export const queueOfflineSessionWrite = (appSlug, patch) => {
  const key = `${SESSION_QUEUE_PREFIX}${appSlug}`;
  writeJson(key, { ...(readJson(key) || {}), ...patch });
};

export const flushOfflineSessionWrites = async (appSlug, sessionId, appSessionService) => {
  const key = `${SESSION_QUEUE_PREFIX}${appSlug}`;
  const queued = readJson(key);
  if (!queued || !sessionId || !appSessionService) {
    return;
  }

  globalThis.localStorage?.removeItem(key);

  if (queued.view_state) {
    await appSessionService.saveViewState({ id: sessionId, view_state: queued.view_state, route_path: queued.route_path });
  }
  if (queued.draft_payload) {
    await appSessionService.saveDraft({ id: sessionId, draft_payload: queued.draft_payload });
  }
};

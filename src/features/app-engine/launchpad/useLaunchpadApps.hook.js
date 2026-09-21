import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@veripass/react-sdk";
import { openSnackbar } from "@link-loom/react-sdk";

import fetchAllPages from "../../../services/utils/fetchAllPages";
import { useAppEngineSDK } from "../context/AppEngineSDK.context";
import { useLaunchpadConfig } from "./LaunchpadConfig.context";

/**
 * Everything the launchpad shows — the rail and the "My apps" page read the
 * same thing.
 *
 * "Pinned" is Link Loom Cloud's own preference (`is_pinned` on the app
 * preference record), the one the App Store's pin button writes and the one
 * Sommatic's home reads. "Recent" is local: the last apps opened from here, in
 * this browser. The platforms the host hands `LaunchpadProvider` are always
 * there, so a person with nothing installed still has somewhere to go.
 *
 * Must render under an `AppEngineSDKProvider`.
 */
const recentKeyFor = (namespace) => `${namespace}::launchpad::recent`;
/**
 * A platform of the ecosystem is not an app definition, so Link Loom Cloud has
 * nowhere to record a pin for it. Taking one off the rail is therefore a local
 * decision, kept beside the recents: the list of the ones this browser hides.
 */
const hiddenPlatformsKeyFor = (namespace) => `${namespace}::launchpad::hidden-platforms`;
const RECENT_MAX = 8;

/**
 * The rail and the launchpad page each mount their own copy of this hook, so
 * pinning in one has to reach the other. The subscribers are module-level:
 * whoever writes a pin tells everyone to reload.
 */
const listeners = new Set();
const notifyPinned = () => listeners.forEach((listener) => listener());

/**
 * Pin writes for one app, one after another.
 *
 * A pin is a read of the person's preferences followed by a create or an
 * update. Fire two of those at once — which dragging makes easy: into Pinned
 * and straight back out — and both read the same "before" and the later write
 * can lose. Chaining per app keeps the record honest without a lock on
 * everything else.
 */
const pinWrites = new Map();
const queuePinWrite = (appId, task) => {
  const next = (pinWrites.get(appId) || Promise.resolve()).then(task, task);
  pinWrites.set(
    appId,
    next.finally(() => {
      if (pinWrites.get(appId) === next) pinWrites.delete(appId);
    }),
  );
  return next;
};

/**
 * What the last fetch returned, kept for the session. The launchpad is a place
 * people come back to, and waiting half a second on an empty screen before the
 * apps animate in is the opposite of what it is for: with the cache the grid
 * is there in the first paint and the entrance plays at once, while a fresh
 * copy is fetched behind it.
 */
const cache = { key: null, apps: [] };
const cacheKey = (organizationId, identity) => `${organizationId || ""}|${identity || ""}`;

const readList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const writeHiddenPlatforms = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // A private window can refuse storage; the rail just keeps them all.
  }
};

const writeRecent = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    // A private window can refuse storage; the launchpad still works.
  }
};

/** A platform of the ecosystem, in the same shape as an app so tiles need no branch. */
export const toPlatformEntry = (platform) => ({
  kind: "platform",
  id: `platform:${platform.id}`,
  slug: platform.id,
  name: platform.title,
  description: platform.tagline,
  image: platform.icon,
  color: platform.color,
  link: platform.link,
});

export default function useLaunchpadApps() {
  // Hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appPreferenceService, appDefinitionService } = useAppEngineSDK();
  const { labels, platforms: hostPlatforms, paths, storageNamespace } = useLaunchpadConfig();
  const recentKey = recentKeyFor(storageNamespace);
  const hiddenPlatformsKey = hiddenPlatformsKeyFor(storageNamespace);
  // The pin callback outlives a locale switch; it reads the copy of the moment it fails.
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  // The preference records are keyed by the session identity, the same one
  // the App Store writes with; anything else and the pins would never match.
  const userIdentity = user?.identity;
  const organizationId = user?.payload?.organization_id;
  const key = cacheKey(organizationId, userIdentity);
  const cached = cache.key === key ? cache.apps : null;

  // Models
  const [apps, setApps] = useState(cached || []);
  const [recentKeys, setRecentKeys] = useState(() => readList(recentKey));
  const [hiddenPlatforms, setHiddenPlatforms] = useState(() => readList(hiddenPlatformsKey));

  // UI states
  const [isLoading, setIsLoading] = useState(!cached);
  const [hasError, setHasError] = useState(false);

  // Component Functions
  const load = useCallback(async () => {
    if (!appDefinitionService || !organizationId) {
      setIsLoading(false);
      return;
    }

    // A revalidation behind a painted grid must not blank it out.
    if (cache.key !== key) setIsLoading(true);
    setHasError(false);

    try {
      const [definitions, preferences] = await Promise.all([
        fetchAllPages((params) => appDefinitionService.getMarketplace(params), { organization_id: organizationId }),
        userIdentity && appPreferenceService ? fetchAllPages(appPreferenceService, { queryselector: "user", search: userIdentity }) : Promise.resolve(null),
      ]);

      const prefById = {};
      (preferences?.result?.items || []).forEach((pref) => {
        if (pref?.app_definition_id) prefById[pref.app_definition_id] = pref;
      });

      // A partial catalog would quietly drop apps from the grid and the rail; fail loudly instead.
      if (!definitions?.success) {
        throw new Error(definitions?.message || "The app catalog did not load");
      }

      const items = definitions.result.items.map((app) => ({
        ...app,
        kind: "app",
        is_pinned: Boolean(prefById[app.id]?.is_pinned),
        is_favorite: Boolean(prefById[app.id]?.is_favorite),
      }));

      cache.key = key;
      cache.apps = items;
      setApps(items);
    } catch (error) {
      console.error("[launchpad] Failed to load apps:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [appDefinitionService, appPreferenceService, organizationId, userIdentity, key]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const reload = () => {
      setHiddenPlatforms(readList(hiddenPlatformsKey));
      load();
    };
    listeners.add(reload);
    return () => listeners.delete(reload);
  }, [load, hiddenPlatformsKey]);

  // Derived
  // Every platform, each carrying whether it is on the rail — the context menu
  // reads that to know if it offers to add it or to take it off.
  const platforms = useMemo(
    () => hostPlatforms.map((platform) => ({ ...toPlatformEntry(platform), is_pinned: !hiddenPlatforms.includes(platform.id) })),
    [hostPlatforms, hiddenPlatforms],
  );
  const railPlatforms = useMemo(() => platforms.filter((platform) => platform.is_pinned), [platforms]);
  const pinned = useMemo(() => apps.filter((app) => app.is_pinned), [apps]);

  const byKey = useMemo(() => {
    const map = new Map();
    apps.forEach((app) => map.set(app.id, app));
    platforms.forEach((platform) => map.set(platform.id, platform));
    return map;
  }, [apps, platforms]);

  const recent = useMemo(() => recentKeys.map((key) => byKey.get(key)).filter(Boolean), [recentKeys, byKey]);

  /** Opens an app (its runtime) or a platform (its site), and remembers it. */
  const launch = useCallback(
    (entry) => {
      if (!entry) return;

      const next = [entry.id, ...recentKeys.filter((key) => key !== entry.id)].slice(0, RECENT_MAX);
      setRecentKeys(next);
      writeRecent(recentKey, next);

      if (entry.kind === "platform") {
        window.open(entry.link, "_blank", "noopener,noreferrer");
        return;
      }
      navigate(paths.runtime(entry.slug));
    },
    [navigate, recentKeys, recentKey, paths],
  );

  /**
   * Pins or unpins an app. Writes the same preference record the App Store's
   * pin button writes (`is_pinned`), so the rail, this page, the store and
   * Sommatic's home never disagree; the tile flips at once and rolls back if
   * the write fails.
   */
  const togglePin = useCallback(
    async (entry) => {
      if (!entry) return false;

      // A platform's place on the rail is a local preference, not a record.
      if (entry.kind === "platform") {
        const next = hiddenPlatforms.includes(entry.slug) ? hiddenPlatforms.filter((id) => id !== entry.slug) : [...hiddenPlatforms, entry.slug];
        setHiddenPlatforms(next);
        writeHiddenPlatforms(hiddenPlatformsKey, next);
        notifyPinned();
        return true;
      }

      if (entry.kind !== "app" || !appPreferenceService || !userIdentity) return false;

      const next = !entry.is_pinned;
      setApps((list) => list.map((app) => (app.id === entry.id ? { ...app, is_pinned: next } : app)));

      return queuePinWrite(entry.id, async () => {
        try {
          const existing = await fetchAllPages(appPreferenceService, { queryselector: "user", search: userIdentity });
          const record = (existing?.result?.items || []).find((pref) => pref.app_definition_id === entry.id);

          if (record) await appPreferenceService.update({ id: record.id, is_pinned: next });
          else
            await appPreferenceService.create({
              // The field is `user_id`, and it carries the veripass identity —
              // the same shape the App Store writes, or the two would each keep
              // their own half of the preference.
              user_id: userIdentity,
              app_definition_id: entry.id,
              organization_id: organizationId,
              is_pinned: next,
              is_favorite: Boolean(entry.is_favorite),
            });

          cache.apps = cache.apps.map((app) => (app.id === entry.id ? { ...app, is_pinned: next } : app));
          notifyPinned();
          return true;
        } catch (error) {
          console.error("[launchpad] Failed to persist the pin:", error);
          setApps((list) => list.map((app) => (app.id === entry.id ? { ...app, is_pinned: !next } : app)));
          openSnackbar(labelsRef.current.menu.pinFailed, "error");
          return false;
        }
      });
    },
    [appPreferenceService, organizationId, userIdentity, hiddenPlatforms, hiddenPlatformsKey],
  );

  /** Where an entry lives: an app's runtime, or a platform's own site. */
  const hrefFor = useCallback(
    (entry) => (entry?.kind === "platform" ? entry.link : `${window.location.origin}${paths.runtime(entry?.slug)}`),
    [paths],
  );

  return { apps, pinned, recent, platforms, railPlatforms, isLoading, hasError, launch, togglePin, hrefFor, refresh: load };
}

import React, { createContext, useContext, useMemo } from "react";

import {
  APP_STORE_LABELS,
  LAUNCHPAD_LABELS,
  LAUNCHPAD_STORAGE_NAMESPACE,
  buildLaunchpadPaths,
} from "@/components/app-engine/defaults/launchpad.defaults";
import { mergeDefaults } from "@/components/app-engine/defaults/appEngine.defaults";

const buildConfig = ({ labels, storeLabels, platforms, paths, basePath, baseUrl, storageNamespace } = {}) => ({
  labels: mergeDefaults(LAUNCHPAD_LABELS, labels),
  storeLabels: mergeDefaults(APP_STORE_LABELS, storeLabels),
  platforms: Array.isArray(platforms) ? platforms : [],
  paths: mergeDefaults(buildLaunchpadPaths(basePath), paths),
  baseUrl: baseUrl || "",
  storageNamespace: storageNamespace || LAUNCHPAD_STORAGE_NAMESPACE,
});

const LaunchpadConfigContext = createContext(buildConfig());

/**
 * What a host tells the launchpad, the rail and the App Store about itself: its copy, the platforms of
 * its ecosystem (`{ id, title, link, icon, color, tagline }`), its routes and the prefix of the browser
 * storage keys. `basePath` (`/client`, `/admin`) builds the four routes — My apps, the App Store, an
 * app's runtime and its studio — and `paths` overrides any of them. `baseUrl` is the Link Loom Cloud
 * backend the rail, My apps and the App Store talk to. Mount it once around the layout so the rail
 * (sidebar) and the pages (outlet) read the same configuration. Without it every surface falls back
 * to the English defaults.
 */
function LaunchpadProvider({ labels, storeLabels, platforms, paths, basePath, baseUrl, storageNamespace, children }) {
  const config = useMemo(
    () => buildConfig({ labels, storeLabels, platforms, paths, basePath, baseUrl, storageNamespace }),
    [labels, storeLabels, platforms, paths, basePath, baseUrl, storageNamespace],
  );

  return <LaunchpadConfigContext.Provider value={config}>{children}</LaunchpadConfigContext.Provider>;
}

const useLaunchpadConfig = () => useContext(LaunchpadConfigContext);

export { LaunchpadProvider, useLaunchpadConfig };

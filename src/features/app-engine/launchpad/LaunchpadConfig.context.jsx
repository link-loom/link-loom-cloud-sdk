import React, { createContext, useContext, useMemo } from "react";

import {
  APP_STORE_LABELS,
  LAUNCHPAD_LABELS,
  LAUNCHPAD_PATHS,
  LAUNCHPAD_STORAGE_NAMESPACE,
} from "@/components/app-engine/defaults/launchpad.defaults";
import { mergeDefaults } from "@/components/app-engine/defaults/appEngine.defaults";

const buildConfig = ({ labels, storeLabels, platforms, paths, storageNamespace } = {}) => ({
  labels: mergeDefaults(LAUNCHPAD_LABELS, labels),
  storeLabels: mergeDefaults(APP_STORE_LABELS, storeLabels),
  platforms: Array.isArray(platforms) ? platforms : [],
  paths: mergeDefaults(LAUNCHPAD_PATHS, paths),
  storageNamespace: storageNamespace || LAUNCHPAD_STORAGE_NAMESPACE,
});

const LaunchpadConfigContext = createContext(buildConfig());

/**
 * What a host tells the launchpad, the rail and the App Store about itself: its copy, the platforms of
 * its ecosystem (`{ id, title, link, icon, color, tagline }`), its routes and the prefix of the browser
 * storage keys. Mount it once around the layout so the rail (sidebar) and the pages (outlet) read the
 * same configuration. Without it every surface falls back to the English defaults.
 */
function LaunchpadProvider({ labels, storeLabels, platforms, paths, storageNamespace, children }) {
  const config = useMemo(
    () => buildConfig({ labels, storeLabels, platforms, paths, storageNamespace }),
    [labels, storeLabels, platforms, paths, storageNamespace],
  );

  return <LaunchpadConfigContext.Provider value={config}>{children}</LaunchpadConfigContext.Provider>;
}

const useLaunchpadConfig = () => useContext(LaunchpadConfigContext);

export { LaunchpadProvider, useLaunchpadConfig };

import React from "react";
import { Navigate, Route } from "react-router-dom";

import { STONEOS_LAUNCHPAD_SEGMENTS } from "@/components/app-engine/defaults/launchpad.defaults";
import StoneOSAppsPage from "@/components/app-engine/launchpad/StoneOSAppsPage.component";
import StoneOSStorePage from "@/components/app-engine/launchpad/StoneOSStorePage.component";

/**
 * The StoneOS Launchpad's routes — `stoneos` (to My apps), `stoneos/apps` and `stoneos/store/*` — for
 * the host to place under its own base route, next to its other domain routes:
 *
 *   <Route path="/admin" element={<LayoutAdmin />}>{stoneOSLaunchpadRoutes()}</Route>
 *
 * The paths the launchpad navigates to come from the same segments: give `LaunchpadProvider` the
 * same `basePath`. `appsPageProps` and `storePageProps` pass the host's bridges and create form.
 */
const stoneOSLaunchpadRoutes = ({ appsPageProps = {}, storePageProps = {} } = {}) => {
  const { section, apps, store } = STONEOS_LAUNCHPAD_SEGMENTS;

  return (
    <Route path={section}>
      <Route index element={<Navigate to={apps} replace />} />
      <Route path={apps} element={<StoneOSAppsPage {...appsPageProps} />} />
      <Route path={`${store}/*`} element={<StoneOSStorePage {...storePageProps} />} />
    </Route>
  );
};

export default stoneOSLaunchpadRoutes;

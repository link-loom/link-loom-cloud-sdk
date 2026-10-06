import React from "react";
import { OnPageLoaded, usePageMeta } from "@link-loom/react-sdk";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import AppLaunchpadComponent from "./AppLaunchpad.component";
import StoneOSPageFrame from "./StoneOSPageFrame.component";

/**
 * "My apps" as a routed page. StoneOS goes in the navbar's breadcrumb, not in the page: My apps and
 * the App Store share one bar of chrome and neither prints a header of its own, so the name of the
 * place stays up top when you switch between them. The page brings its own ground (StoneOSPageFrame),
 * so it looks the same in every host. `renderBridge` is the host's context bridge (the Command
 * Center), see AppLaunchpadComponent.
 */
function StoneOSAppsPage({ baseUrl, renderBridge }) {
  const { labels } = useLaunchpadConfig();

  usePageMeta({ title: labels.stoneOS, breadcrumb: [{ label: labels.stoneOS }] });

  return (
    <StoneOSPageFrame>
      <AppLaunchpadComponent baseUrl={baseUrl} renderBridge={renderBridge} />
      <OnPageLoaded />
    </StoneOSPageFrame>
  );
}

export default StoneOSAppsPage;

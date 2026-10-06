import React from "react";
import { OnPageLoaded, usePageMeta } from "@link-loom/react-sdk";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import AppStoreComponent from "../app-store/AppStore.component";
import StoneOSPageFrame from "./StoneOSPageFrame.component";

/**
 * The App Store as a routed page: mount it on the splat route (`store/*`), the store routes its own
 * screens beneath it. Same title and same ground as My apps (StoneOSPageFrame), the two are halves of
 * one place. `renderBridge` and `renderCreateApp` are the host's, see AppStoreComponent.
 */
function StoneOSStorePage({ baseUrl, renderBridge, renderCreateApp, contentHeight }) {
  const { labels } = useLaunchpadConfig();

  usePageMeta({ title: labels.stoneOS, breadcrumb: [{ label: labels.stoneOS }] });

  return (
    <StoneOSPageFrame>
      <AppStoreComponent
        baseUrl={baseUrl}
        renderBridge={renderBridge}
        renderCreateApp={renderCreateApp}
        contentHeight={contentHeight}
      />
      <OnPageLoaded />
    </StoneOSPageFrame>
  );
}

export default StoneOSStorePage;

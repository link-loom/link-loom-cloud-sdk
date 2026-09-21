import React from "react";

import AppIcon from "./AppIcon.component";
import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";

export const hasSvgAppIcon = (app) => Boolean(app?.icon && typeof app.icon === "object" && app.icon.type === "svg");

/**
 * The icon of an app definition on catalog surfaces (launchpad, rail, App Store): the published SVG
 * served by the same Link Loom Cloud backend the catalog was read from, or the MUI icon named by a
 * legacy `icon` string. Must render under an `AppEngineSDKProvider`.
 */
function CatalogAppIconComponent({ app, size = 24, fallbackIcon, sx }) {
  const { appDefinitionService } = useAppEngineSDK();

  return (
    <AppIcon
      appDefinition={app}
      size={size}
      baseUrl={appDefinitionService?.serviceEndpoints?.baseUrl}
      fallbackIcon={fallbackIcon}
      sx={sx}
    />
  );
}

export default CatalogAppIconComponent;

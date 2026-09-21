import React from "react";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { StorefrontOutlined as StoreIcon } from "@mui/icons-material";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { buildStorePaths } from "@/features/app-engine/app-store/app-store.routes";
import { LAUNCHPAD_THEME as THEME, alpha } from "../../defaults/launchpad.theme";

/**
 * What an app's runtime shows when the organization can see the app but does not have it: not a
 * failure, a way to get it — the app's page in the App Store, where "Get" grants it.
 */
function AppNotEntitledComponent({ appSlug, minHeight }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { storeLabels, paths } = useLaunchpadConfig();
  const inRouter = useInRouterContext();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const labels = storeLabels.notEntitled;
  const target = buildStorePaths(paths.store).app(appSlug);
  const linkProps = inRouter ? { component: RouterLink, to: target } : { href: target };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      role="alert"
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 1, height: "100%", minHeight, p: 3 }}
    >
      <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "grid", placeItems: "center", color: THEME.brand, backgroundColor: alpha(THEME.brand, 10) }}>
        <StoreIcon />
      </Box>
      <Typography variant="h4" component="h2" sx={{ mt: 1 }}>
        {labels.title}
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 400 }}>
        {labels.hint}
      </Typography>
      <Button variant="contained" sx={{ mt: 1.5 }} {...linkProps}>
        {labels.action}
      </Button>
    </Box>
  );
}

export default AppNotEntitledComponent;

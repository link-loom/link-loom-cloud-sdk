import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { focusRingSx, interactiveSurfaceSx } from "../app-store.styles";
import AppStoreSuiteGlyphComponent from "./AppStoreSuiteGlyph.component";

/**
 * A suite as a tile: its mark, its name, its tagline (when `withTagline`) and how much of it the
 * organization already uses, with the green "In use" badge when it uses any. The whole tile opens the
 * suite's page.
 */
function AppStoreSuiteTileComponent({ suite, withTagline = false, index = 0 }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const total = Number(suite.apps_total ?? suite.apps?.length) || 0;
  const inUse = Number(suite.apps_in_use) || 0;

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      component={RouterLink}
      to={storePaths.suite(suite.slug)}
      className="loom-store-enter"
      style={{ "--i": Math.min(index, 24) }}
      sx={{
        ...interactiveSurfaceSx,
        height: "100%",
        p: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
        boxSizing: "border-box",
        color: "inherit",
        textDecoration: "none",
        "&:hover": { ...interactiveSurfaceSx["&:hover, &:focus-within"], color: "inherit", textDecoration: "none" },
        ...focusRingSx,
      }}
    >
      <Box className="d-flex align-items-center justify-content-between">
        <AppStoreSuiteGlyphComponent suite={suite} size={40} />
        {inUse > 0 && (
          <Box
            component="span"
            sx={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.4,
              px: "7px",
              py: "3px",
              borderRadius: "999px",
              color: COLORS.success,
              backgroundColor: COLORS.successTint,
            }}
          >
            {labels.suites.inUse}
          </Box>
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h3" noWrap sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
          {suite.name}
        </Typography>
        {withTagline && suite.tagline && (
          <Typography
            component="p"
            sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textSecondary, mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {suite.tagline}
          </Typography>
        )}
      </Box>
      <Typography component="p" sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary, mt: "auto" }}>
        {inUse > 0 ? labels.suites.usage(inUse, total) : labels.suites.appsCount(total)}
      </Typography>
    </Box>
  );
}

export default AppStoreSuiteTileComponent;

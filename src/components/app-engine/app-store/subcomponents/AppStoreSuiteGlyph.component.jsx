import React from "react";
import { Box } from "@mui/material";

import DynamicMuiIcon from "../../DynamicMuiIcon.component";
import { alpha } from "../../defaults/launchpad.theme";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";

/**
 * A suite's mark: its colour on the launchpad's square, with its icon, or four tiles — a suite is a
 * folder of apps — when it has none.
 */
function AppStoreSuiteGlyphComponent({ suite, size = 40 }) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const color = suite?.color || COLORS.accent;
  const iconName = typeof suite?.icon === "string" ? suite.icon : "";

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (iconName) {
    return (
      <Box
        aria-hidden="true"
        sx={{ width: size, height: size, flex: "none", borderRadius: "26%", display: "grid", placeItems: "center", backgroundColor: color }}
      >
        <DynamicMuiIcon iconName={iconName} sx={{ fontSize: size * 0.5, color: COLORS.textOnAccent }} />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "26%",
        backgroundColor: color,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: `${Math.max(2, Math.round(size / 13))}px`,
        p: `${Math.round(size / 5)}px`,
        boxSizing: "border-box",
      }}
    >
      {[90, 55, 55, 90].map((opacity, index) => (
        <Box key={index} sx={{ borderRadius: "3px", backgroundColor: alpha(COLORS.textOnAccent, opacity) }} />
      ))}
    </Box>
  );
}

export default AppStoreSuiteGlyphComponent;

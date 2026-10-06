import React from "react";
import { Box } from "@mui/material";
import { ArrowForward as SeeAllIcon } from "@mui/icons-material";

import { alpha } from "../../defaults/launchpad.theme";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";

const WHITE = COLORS.textOnAccent;

// A 2×2 grid of small squares inside a rounded square: the store's mark for "a collection of apps".
const tileGridSx = (padding) => ({
  width: 18,
  height: 18,
  flex: "none",
  borderRadius: "5px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2px",
  p: `${padding}px`,
  boxSizing: "border-box",
});

function TileGrid({ sx, cells }) {
  return (
    <Box component="span" aria-hidden="true" sx={sx}>
      {cells.map((color, index) => (
        <Box key={index} component="span" sx={{ borderRadius: "1px", backgroundColor: color }} />
      ))}
    </Box>
  );
}

/**
 * The small mark before a sidebar row. Plain shapes, not icons:
 * - `discover`: an accent square holding four white tiles.
 * - `suites`: an outlined square holding four grey tiles.
 * - `organization`: an ink square with the organization's initial.
 * - `suite` and `category`: in the expanded column, where the label is on screen, the original shapes: a
 *   square in the suite's colour and a grey dot (accent when the category is the one on screen). In the
 *   rail, where the label is hidden, a tinted square with the two initials.
 * - `see-all`: an accent arrow, "go to the whole list".
 */
function AppStoreSidebarGlyphComponent({ variant, color, initial, initials, rail = false, active = false }) {
  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (variant === "discover") {
    return <TileGrid sx={{ ...tileGridSx(4), backgroundColor: COLORS.accent }} cells={[WHITE, alpha(WHITE, 60), alpha(WHITE, 60), WHITE]} />;
  }

  if (variant === "suites") {
    const ink = COLORS.textTertiary;
    return <TileGrid sx={{ ...tileGridSx(3), border: `1.5px solid ${ink}` }} cells={[ink, ink, ink, ink]} />;
  }

  if (variant === "organization") {
    return (
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 18,
          height: 18,
          flex: "none",
          borderRadius: "5px",
          display: "grid",
          placeItems: "center",
          backgroundColor: COLORS.ink,
          color: WHITE,
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {initial}
      </Box>
    );
  }

  if ((variant === "suite" || variant === "category") && rail) {
    return (
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 18,
          height: 18,
          flex: "none",
          borderRadius: "5px",
          display: "grid",
          placeItems: "center",
          backgroundColor: `color-mix(in srgb, ${color} 16%, ${COLORS.surface})`,
          border: `1px solid color-mix(in srgb, ${color} 26%, ${COLORS.surface})`,
          boxSizing: "border-box",
          color: `color-mix(in srgb, ${color} 64%, black)`,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {initials}
      </Box>
    );
  }

  if (variant === "suite") {
    return <Box component="span" aria-hidden="true" sx={{ width: 14, height: 14, flex: "none", borderRadius: "4px", backgroundColor: color || COLORS.accent }} />;
  }

  if (variant === "category") {
    return (
      <Box
        component="span"
        aria-hidden="true"
        sx={{ width: 8, height: 8, flex: "none", mx: "3px", borderRadius: "50%", backgroundColor: active ? COLORS.accent : alpha(COLORS.ink, 15) }}
      />
    );
  }

  return <SeeAllIcon aria-hidden="true" sx={{ flex: "none", fontSize: 16, color: COLORS.accent }} />;
}

export default AppStoreSidebarGlyphComponent;

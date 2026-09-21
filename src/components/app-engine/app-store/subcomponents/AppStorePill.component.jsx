import React from "react";
import { ButtonBase } from "@mui/material";

import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { focusRingSx } from "../app-store.styles";

// Every tone keeps a 1px border (transparent when filled), so a neutral pill is exactly as tall as the others.
const TONES = {
  [STORE_PILL_TONES.accent]: { color: COLORS.textOnAccent, backgroundColor: COLORS.accent, hover: { backgroundColor: COLORS.accentHover } },
  [STORE_PILL_TONES.tint]: { color: COLORS.accent, backgroundColor: COLORS.accentTint, hover: { backgroundColor: COLORS.accentTintHover } },
  [STORE_PILL_TONES.dark]: { color: COLORS.textOnAccent, backgroundColor: COLORS.ink, hover: { backgroundColor: COLORS.inkHover } },
  [STORE_PILL_TONES.neutral]: {
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.pillBorder,
    hover: { backgroundColor: COLORS.surfaceMuted, borderColor: COLORS.pillBorderHover },
  },
  [STORE_PILL_TONES.danger]: { color: COLORS.textOnAccent, backgroundColor: COLORS.danger, hover: { backgroundColor: COLORS.dangerHover } },
};

// The mockup's three pills: a card's action (12px), a banner's or a dialog's (13px), a page's one action (14px).
const SIZES = {
  [STORE_PILL_SIZES.small]: { minWidth: 64, px: "15px", py: "5px", fontSize: 12 },
  [STORE_PILL_SIZES.medium]: { minWidth: 72, px: "17px", py: "7px", fontSize: 13 },
  [STORE_PILL_SIZES.large]: { minWidth: 96, px: "25px", py: "8px", fontSize: 14 },
};

/**
 * The one button shape of the App Store: a pill. `tone` says what it does (`STORE_PILL_TONES`), `size`
 * where it sits (`STORE_PILL_SIZES`). It renders a button, or whatever `component` is given with its
 * props (`component={RouterLink} to=…` for a pill that goes somewhere).
 */
function AppStorePillComponent({ tone = STORE_PILL_TONES.neutral, size = STORE_PILL_SIZES.small, fullWidth = false, startIcon = null, sx, children, ...props }) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const { hover, ...rest } = TONES[tone] || TONES[STORE_PILL_TONES.neutral];

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <ButtonBase
      disableRipple
      {...props}
      sx={{
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
        border: "1px solid transparent",
        borderRadius: "999px",
        font: "inherit",
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
        ...SIZES[size],
        ...rest,
        "&:hover": { ...hover, color: rest.color, textDecoration: "none", "@media (hover: none)": { backgroundColor: rest.backgroundColor } },
        "&.Mui-disabled": { cursor: "default", color: COLORS.textTertiary, backgroundColor: COLORS.chip, borderColor: "transparent" },
        "& .MuiSvgIcon-root": { fontSize: "1.15em" },
        ...focusRingSx,
        ...sx,
      }}
    >
      {startIcon}
      {children}
    </ButtonBase>
  );
}

export default AppStorePillComponent;

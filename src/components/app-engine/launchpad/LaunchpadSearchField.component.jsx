import React, { useEffect, useRef } from "react";
import { Box, InputBase } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

import { STORE_COLORS as COLORS } from "../defaults/stoneos-store.palette";

// StoneOS's own colours, the same on My apps and in the App Store — never the host's.
const FIELD_COLORS = {
  surface: COLORS.surface,
  text: COLORS.ink,
  border: COLORS.fieldBorder,
  focusBorder: COLORS.accent,
  focusRing: COLORS.focusRing,
  glyph: COLORS.textTertiary,
  shortcutBackground: COLORS.surfaceMuted,
  shadow: COLORS.shadowSm,
};

const isTypingTarget = (element) =>
  Boolean(element && (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable));

/**
 * The search field of StoneOS: the one at the top of My apps and of the App Store. A 50px field on
 * paper with the glyph on the left and the shortcut as a single pill on the right; focusing it lifts
 * the border to the accent with a soft ring. `/` focuses it from anywhere on the page unless the
 * person is already typing somewhere. `onChange` and `onKeyDown` are the input's own events.
 */
function LaunchpadSearchFieldComponent({ inputRef, value, onChange, onKeyDown, placeholder, shortcut, width = 580 }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const ownRef = useRef(null);
  const fieldRef = inputRef || ownRef;

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      fieldRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fieldRef]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box sx={{ width, maxWidth: "100%", position: "relative" }}>
      {/* The field's root is positioned too and comes after this in the DOM, so
          without a z-index its white background paints straight over the
          glyph — present in the tree, invisible on screen. */}
      <SearchIcon
        sx={{
          position: "absolute",
          zIndex: 1,
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 18,
          color: FIELD_COLORS.glyph,
          pointerEvents: "none",
        }}
      />
      <InputBase
        inputRef={fieldRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        inputProps={{ "aria-label": placeholder }}
        sx={{
          width: "100%",
          height: 50,
          pl: "44px",
          pr: "84px",
          borderRadius: "12px",
          border: `1px solid ${FIELD_COLORS.border}`,
          backgroundColor: FIELD_COLORS.surface,
          color: FIELD_COLORS.text,
          fontSize: 16,
          boxShadow: FIELD_COLORS.shadow,
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          "&.Mui-focused": {
            borderColor: FIELD_COLORS.focusBorder,
            boxShadow: `0 0 0 3px ${FIELD_COLORS.focusRing}`,
          },
        }}
      />
      {/* One pill, not three keys: it is a single shortcut. */}
      <Box
        component="span"
        sx={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: 11,
          letterSpacing: "0.04em",
          px: "8px",
          py: "4px",
          borderRadius: 999,
          border: `1px solid ${FIELD_COLORS.border}`,
          color: FIELD_COLORS.glyph,
          backgroundColor: FIELD_COLORS.shortcutBackground,
        }}
      >
        {shortcut}
      </Box>
    </Box>
  );
}

export default LaunchpadSearchFieldComponent;

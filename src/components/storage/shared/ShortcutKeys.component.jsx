import React from "react";

import { THEME_COLORS, THEME_RADII, THEME_TYPE } from "../defaults/storage.theme";
import { IS_MAC, parseShortcut } from "../defaults/storage.shortcuts";

/**
 * One continuous `<kbd>` badge per combo — the shape Omnisearch uses (⌘⇧W as a single chip),
 * not one chip per key. macOS juxtaposes its symbols; Windows joins the words with a plus.
 * Sized and contrasted like the SDK's `.command-chip` so it reads at a glance in a menu row.
 */
function ShortcutKeys({ spec, extra = [], muted = false }) {
  const specs = [spec, ...extra].filter(Boolean);

  if (!specs.length) {
    return null;
  }

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
    padding: "0 7px",
    borderRadius: THEME_RADII.sm,
    fontFamily: "inherit",
    fontSize: THEME_TYPE.fontSize11,
    fontWeight: 600,
    letterSpacing: IS_MAC ? "0.5px" : 0,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: muted ? THEME_COLORS.textBodyMuted : THEME_COLORS.textStrong,
    background: THEME_COLORS.surfaceTrack,
    border: `1px solid ${THEME_COLORS.borderMuted}`,
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {specs.map((currentSpec) => (
        <kbd key={currentSpec} style={badgeStyle}>
          {parseShortcut(currentSpec).join(IS_MAC ? "" : "+")}
        </kbd>
      ))}
    </span>
  );
}

export default ShortcutKeys;

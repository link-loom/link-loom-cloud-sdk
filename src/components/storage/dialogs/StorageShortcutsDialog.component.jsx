import React from "react";
import { Box, Button } from "@mui/material";
import { Keyboard as KeyboardIcon } from "@mui/icons-material";

import { THEME_COLORS, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";
import { IS_MAC, SHORTCUT_GROUPS } from "../defaults/storage.shortcuts";
import ShortcutKeys from "../shared/ShortcutKeys.component";

function StorageShortcutsDialog({ onClose }) {
  return (
    <section style={{ padding: "1rem", width: "min(640px, 94vw)", fontFamily: "var(--stos-font-ui, inherit)", color: THEME_COLORS.textBody }}>
      <header style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingRight: 36 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: THEME_RADII.md,
            background: tint(THEME_COLORS.brandPrimary, 8),
          }}
        >
          <KeyboardIcon sx={{ fontSize: 18, color: THEME_COLORS.brandPrimary }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h5 style={{ fontWeight: THEME_TYPE.weightStrong, margin: "0", fontSize: THEME_TYPE.fontSize16, color: THEME_COLORS.textStrong }}>Keyboard shortcuts</h5>
          <p style={{ margin: "0", fontSize: THEME_TYPE.fontSize11, color: THEME_COLORS.textSecondary }}>
            {IS_MAC
              ? "The same keys as Finder, except Enter — here it opens instead of renaming."
              : "The same keys as File Explorer."}
          </p>
        </div>
      </header>

      <Box sx={{ display: "grid", gap: "1rem", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {SHORTCUT_GROUPS.map((group) => (
          <article key={group.title}>
            <h6
              style={{
                color: THEME_COLORS.textSecondary,
                marginBottom: "0.5rem",
                fontSize: THEME_TYPE.fontSize11,
                fontWeight: THEME_TYPE.weightStrong,
              }}
            >
              {group.title}
            </h6>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {group.items.map((item) => (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: THEME_TYPE.fontSize12,
                      color: THEME_COLORS.textBody,
                    }}
                  >
                    {item.label}
                  </span>
                  <ShortcutKeys spec={item.spec} extra={item.extra} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </Box>

      <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: THEME_TYPE.fontSize13,
            height: 30,
            boxShadow: "none",
            backgroundColor: THEME_COLORS.brandPrimary,
            "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
          }}
        >
          Got it
        </Button>
      </footer>
    </section>
  );
}

export default StorageShortcutsDialog;

import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { categoryTitle, publisherOf } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import AppStoreAppGlyphComponent from "./AppStoreAppGlyph.component";
import AppStorePillComponent from "./AppStorePill.component";

/**
 * The home's Featured banner (`store/home` → `spotlight`): on the accent's tint, the "Featured"
 * overline, the spotlight's headline and subtitle, then the app — its icon, name and "publisher ·
 * suite" — with a solid **View** pill. View always goes to the app's page, whatever the organization
 * has: the banner presents the app, it never launches it.
 */
function AppStoreSpotlightCardComponent({ app }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const publisher = publisherOf(app);
  const detailPath = storePaths.app(app.slug);
  const byline = [publisher.name, app.suites?.[0]?.name || categoryTitle(labels, app.category)].filter(Boolean).join(" · ");

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      component="section"
      aria-label={labels.discover.featured}
      className="loom-store-fade d-flex flex-column justify-content-between h-100"
      sx={{ gap: 2.5, p: { xs: "22px 20px", md: "26px 28px" }, borderRadius: "18px", border: `1px solid ${COLORS.featuredTintBorder}`, backgroundColor: COLORS.featuredTint, boxSizing: "border-box" }}
    >
      <Box>
        <Typography component="p" sx={{ mb: 1.25, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", lineHeight: 1.4, textTransform: "uppercase", color: COLORS.accent }}>
          {labels.discover.featured}
        </Typography>
        <Typography component="h2" sx={{ maxWidth: 420, mb: 1, fontSize: { xs: 20, md: 24 }, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15, color: COLORS.ink }}>
          {app.headline || app.name}
        </Typography>
        {app.subtitle && (
          <Typography component="p" sx={{ maxWidth: 440, fontSize: 14, lineHeight: 1.45, color: COLORS.textSecondary }}>
            {app.subtitle}
          </Typography>
        )}
      </Box>

      <Box className="d-flex align-items-center" sx={{ gap: 1.75 }}>
        <Box
          component={RouterLink}
          to={detailPath}
          className="d-flex align-items-center flex-grow-1"
          sx={{ gap: 1.75, minWidth: 0, color: "inherit", textDecoration: "none", "&:hover": { color: "inherit" }, "&:hover .loom-store-name": { textDecoration: "underline" } }}
        >
          <AppStoreAppGlyphComponent app={app} size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="p" noWrap className="loom-store-name" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
              {app.name}
            </Typography>
            <Typography component="p" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
              {byline}
            </Typography>
          </Box>
        </Box>
        <AppStorePillComponent
          tone={STORE_PILL_TONES.accent}
          size={STORE_PILL_SIZES.medium}
          component={RouterLink}
          to={detailPath}
          aria-label={labels.card.viewApp(app.name)}
        >
          {labels.card.view}
        </AppStorePillComponent>
      </Box>
    </Box>
  );
}

export default AppStoreSpotlightCardComponent;

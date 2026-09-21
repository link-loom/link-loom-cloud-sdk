import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { categoryTitle, isOwned, isPaid, isUsable, priceCaption, shortDescription } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { interactiveSurfaceSx } from "../app-store.styles";
import AppStoreActionButtonComponent from "./AppStoreActionButton.component";
import AppStoreAppGlyphComponent from "./AppStoreAppGlyph.component";
import AppStoreOwnerMenuComponent from "./AppStoreOwnerMenu.component";

/**
 * An app in a store grid: its icon, name and "suite · category", two lines of what it does, and what
 * it costs (or that the organization has it) next to its pill. The name opens the app's page; the
 * owner of an app also gets its menu.
 */
function AppStoreAppCardComponent({ app, index = 0 }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths, accessOf } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const access = accessOf(app);
  // "Free" stands out like a price; the access or the pricing model beside a priced pill stay quiet.
  const captionIsPrice = !isUsable(access) && !isPaid(app.pricing);
  const suiteName = app.suites?.[0]?.name || "";
  const description = shortDescription(app) || labels.card.noDescription;

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      className="loom-store-enter"
      style={{ "--i": Math.min(index, 24) }}
      data-app-slug={app.slug}
      sx={{ ...interactiveSurfaceSx, height: "100%", p: 2, display: "flex", flexDirection: "column", gap: 1.5, boxSizing: "border-box" }}
    >
      <Box className="d-flex align-items-start gap-2">
        <Box
          component={RouterLink}
          to={storePaths.app(app.slug)}
          className="d-flex align-items-center gap-3 flex-grow-1"
          sx={{ minWidth: 0, color: "inherit", textDecoration: "none", "&:hover": { color: "inherit" }, "&:hover .loom-store-name": { textDecoration: "underline" } }}
        >
          <AppStoreAppGlyphComponent app={app} size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h3" noWrap className="loom-store-name" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
              {app.name}
            </Typography>
            <Typography component="p" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
              {labels.card.line(suiteName, categoryTitle(labels, app.category))}
            </Typography>
          </Box>
        </Box>
        {isOwned(access) && <AppStoreOwnerMenuComponent app={app} />}
      </Box>

      <Typography
        component="p"
        sx={{
          fontSize: 13,
          lineHeight: 1.4,
          color: COLORS.textSecondary,
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </Typography>

      <Box className="d-flex align-items-center justify-content-between gap-2 mt-auto">
        <Typography component="p" noWrap sx={{ minWidth: 0, fontSize: 13, fontWeight: captionIsPrice ? 600 : 500, color: captionIsPrice ? COLORS.ink : COLORS.textTertiary }}>
          {priceCaption(labels, { access, pricing: app.pricing })}
        </Typography>
        <AppStoreActionButtonComponent app={app} />
      </Box>
    </Box>
  );
}

export default AppStoreAppCardComponent;

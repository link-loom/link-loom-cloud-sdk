import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { categoryTitle, isPaid, isUsable, priceCaption, publisherOf } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_BELOW_SM_MEDIA } from "../app-store.styles";
import AppStoreActionButtonComponent from "./AppStoreActionButton.component";
import AppStoreAppGlyphComponent from "./AppStoreAppGlyph.component";

/**
 * An app as one line of the search results: who makes it, its suite and category, its price or
 * access, and its pill.
 */
function AppStoreAppRowComponent({ app, divided = false, index = 0 }) {
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
  const publisher = publisherOf(app);
  const secondLine = [publisher.name, app.suites?.[0]?.name, categoryTitle(labels, app.category)].filter(Boolean).join(" · ");

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      className="d-flex align-items-center gap-3 loom-store-enter"
      style={{ "--i": index % 25 }}
      sx={{
        flexWrap: "wrap",
        rowGap: 1,
        py: 1.5,
        px: divided ? 2.25 : 0,
        borderTop: divided && index > 0 ? `1px solid ${COLORS.hairlineSoft}` : 0,
        transition: "background-color 120ms ease",
        "&:hover": { backgroundColor: divided ? COLORS.surfaceMuted : "transparent" },
      }}
    >
      <Box
        component={RouterLink}
        to={storePaths.app(app.slug)}
        className="d-flex align-items-center gap-3"
        // At least 150px for the name: a pill too wide to sit beside it (Buy · price on a phone) wraps under it.
        sx={{ flex: "1 1 150px", minWidth: 0, color: "inherit", textDecoration: "none", "&:hover": { color: "inherit" }, "&:hover .loom-store-name": { textDecoration: "underline" } }}
      >
        <AppStoreAppGlyphComponent app={app} size={44} />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="p" noWrap className="loom-store-name" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
            {app.name}
          </Typography>
          <Typography component="p" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
            {secondLine}
          </Typography>
        </Box>
      </Box>
      {/* On a phone the price steps aside for the name; the pill and the app's page still say it. */}
      <Typography
        component="span"
        noWrap
        sx={{ flex: "none", fontSize: 13, fontWeight: captionIsPrice ? 600 : 500, color: captionIsPrice ? COLORS.ink : COLORS.textTertiary, [STORE_BELOW_SM_MEDIA]: { display: "none" } }}
      >
        {priceCaption(labels, { access, pricing: app.pricing })}
      </Typography>
      <Box sx={{ flex: "none", ml: "auto" }}>
        <AppStoreActionButtonComponent app={app} />
      </Box>
    </Box>
  );
}

export default AppStoreAppRowComponent;

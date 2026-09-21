import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_ACCESS_STATES, enumKeyOf } from "@/features/app-engine/app-store/app-store.enums";
import { isUsable, priceShort, shortDescription } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { focusRingSx, overlineSx } from "../app-store.styles";
import AppStoreAppGlyphComponent from "./AppStoreAppGlyph.component";

// Below this width the card gives each app its whole line: the price or access note steps aside so
// the name stays readable (the app's page still says it).
const NARROW_CARD_QUERY = "@container loom-store-suggested (max-width: 259px)";

function SuggestedRow({ app, index }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths, accessOf } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const access = accessOf(app);
  const trailing = isUsable(access) ? labels.access[enumKeyOf(STORE_ACCESS_STATES, access)] : priceShort(labels, app.pricing);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box component="li" className="loom-store-enter" style={{ "--i": index }}>
      <Box
        component={RouterLink}
        to={storePaths.app(app.slug)}
        className="d-flex align-items-center"
        sx={{
          gap: 1.5,
          minWidth: 0,
          color: "inherit",
          textDecoration: "none",
          borderRadius: "8px",
          "&:hover": { color: "inherit" },
          "&:hover .loom-store-name": { textDecoration: "underline" },
          ...focusRingSx,
        }}
      >
        <AppStoreAppGlyphComponent app={app} size={36} />
        <Box className="flex-grow-1" sx={{ minWidth: 0 }}>
          <Typography component="p" noWrap className="loom-store-name" sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
            {app.name}
          </Typography>
          <Typography component="p" noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
            {app.headline || shortDescription(app) || labels.card.noDescription}
          </Typography>
        </Box>
        <Typography component="span" noWrap sx={{ flex: "none", fontSize: 12, color: COLORS.textTertiary, [NARROW_CARD_QUERY]: { display: "none" } }}>
          {trailing}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * "Suggested for you": every app the store features (`store/home` → `suggested`, whatever the
 * organization already has), each row opening the app's page with its price — or "In your apps" when
 * the organization has it — on the right. The line under the title only says what the list is.
 */
function AppStoreSuggestedCardComponent({ apps }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels } = useAppStore();

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      component="section"
      aria-label={labels.discover.suggested}
      className="loom-store-fade d-flex flex-column h-100"
      sx={{
        minWidth: 0,
        containerType: "inline-size",
        containerName: "loom-store-suggested",
        p: { xs: "20px", md: "22px 24px" },
        borderRadius: "18px",
        border: `1px solid ${COLORS.hairline}`,
        backgroundColor: COLORS.surface,
        boxSizing: "border-box",
      }}
    >
      <Typography component="p" sx={{ ...overlineSx, mb: 0.5 }}>
        {labels.discover.suggested}
      </Typography>
      <Typography component="p" sx={{ mb: 1.75, fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
        {labels.discover.suggestedNote}
      </Typography>
      <Box component="ul" className="d-flex flex-column flex-grow-1 list-unstyled m-0 p-0" sx={{ gap: 1.5 }}>
        {apps.map((app, index) => (
          <SuggestedRow key={app.slug} app={app} index={index} />
        ))}
      </Box>
    </Box>
  );
}

export default AppStoreSuggestedCardComponent;

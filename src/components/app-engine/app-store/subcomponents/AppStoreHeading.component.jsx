import React from "react";
import { Box, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_BELOW_SM_MEDIA, textLinkSx } from "../app-store.styles";

// The mockup's two title sizes: a section (17px) and a page (24px).
const titleSx = (pageTitle) => ({
  fontSize: pageTitle ? { xs: 22, md: 24 } : 17,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  lineHeight: pageTitle ? 1.15 : 1.3,
  color: COLORS.ink,
});

/** A section's title with, on the right, its count or its "see all" link. A page's own title passes `pageTitle`. */
export function AppStoreSectionHeader({ title, trailing, component = "h2", pageTitle = false }) {
  return (
    <Box className="d-flex align-items-baseline justify-content-between flex-wrap gap-2" sx={{ mb: 1.75 }}>
      <Typography component={component} sx={titleSx(pageTitle)}>
        {title}
      </Typography>
      {trailing}
    </Box>
  );
}

/** A page's title on its own (a suite, a category, an organization). */
export function AppStorePageTitle({ children, component = "h1" }) {
  return (
    <Typography component={component} sx={titleSx(true)}>
      {children}
    </Typography>
  );
}

/** The quiet count beside a section title. */
export function AppStoreCount({ children }) {
  return (
    <Typography component="span" sx={{ fontSize: 13, color: COLORS.textTertiary }}>
      {children}
    </Typography>
  );
}

/**
 * "← Back": it lives in the left cell of the StoneOS tabs bar, not in the page; on a phone only the
 * arrow stays and the label remains the button's accessible name.
 */
export function AppStoreBackLink({ label, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={label}
      className="d-inline-flex align-items-center"
      sx={{ ...textLinkSx, gap: "6px", minWidth: 0, maxWidth: "100%", fontSize: 13, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap" }}
    >
      <ArrowBackIcon sx={{ fontSize: 16, flex: "none" }} />
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", [STORE_BELOW_SM_MEDIA]: { display: "none" } }}>
        {label}
      </Box>
    </Box>
  );
}

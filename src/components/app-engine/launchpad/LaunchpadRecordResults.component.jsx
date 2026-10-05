import React from "react";
import { Box, Typography } from "@mui/material";

import { LAUNCHPAD_THEME as THEME } from "../defaults/launchpad.theme";
import AppIcon from "../AppIcon.component";
import { useAppEngineSDK } from "../../../features/app-engine/context/AppEngineSDK.context";
import { APP_LOGO } from "../../../features/app-engine/search/app-search.category";
import { RECORD_SEARCH_STATUSES } from "../../../features/app-engine/search/app-search.runner";
import { hitContextLine, hitKey } from "../../../features/app-engine/search/app-search.utils";

/**
 * The records the person's apps found for the text of the launchpad search, under the apps that
 * match it. Each row is the record (its title and a line of context) with the app it lives in;
 * opening it goes to that record inside its app. It shows nothing until there is something to say:
 * no text, nothing found, or the apps did not answer.
 */
function LaunchpadRecordResultsComponent({ hits, status, labels, locale, onOpen }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { appDefinitionService } = useAppEngineSDK();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const baseUrl = appDefinitionService?.serviceEndpoints?.baseUrl;
  const isSearching = status === RECORD_SEARCH_STATUSES.loading;
  const hasFailed = status === RECORD_SEARCH_STATUSES.error;

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (status === RECORD_SEARCH_STATUSES.idle) return null;
  if (status === RECORD_SEARCH_STATUSES.ready && hits.length === 0) return null;

  return (
    <Box sx={{ mt: 4.5 }} aria-live="polite">
      <Typography variant="overline" sx={{ display: "block", color: THEME.textTertiary, mb: 1.5 }}>
        {isSearching && labels.searching}
        {hasFailed && labels.failed}
        {status === RECORD_SEARCH_STATUSES.ready && labels.found(hits.length)}
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        {hits.map((hit) => (
          <li key={hitKey(hit)}>
            <Box
              component="button"
              type="button"
              onClick={() => onOpen(hit)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                p: "10px 12px",
                border: 0,
                borderRadius: THEME.radiusMd,
                background: "transparent",
                color: "text.primary",
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
                "&:hover, &:focus-visible": { backgroundColor: THEME.tileHover },
                "&:focus-visible": { outline: `2px solid ${THEME.brand}`, outlineOffset: "-2px" },
              }}
            >
              <AppIcon slug={hit.app_slug} icon={APP_LOGO} baseUrl={baseUrl} size={28} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }} title={hit.title}>
                  {hit.title}
                </Typography>
                {hit.subtitle && (
                  <Typography noWrap sx={{ fontSize: 13, color: THEME.textSecondary }} title={hit.subtitle}>
                    {hit.subtitle}
                  </Typography>
                )}
              </Box>
              <Typography
                noWrap
                sx={{ fontSize: 12, color: THEME.textTertiary, maxWidth: { xs: "40%", md: "34%" } }}
                title={hitContextLine(hit, locale)}
              >
                {hitContextLine(hit, locale)}
              </Typography>
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  );
}

export default LaunchpadRecordResultsComponent;

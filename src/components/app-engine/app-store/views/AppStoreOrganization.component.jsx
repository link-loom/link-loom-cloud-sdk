import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useStorePagedApps from "@/features/app-engine/app-store/useStorePagedApps.hook";
import { STORE_PILL_SIZES, STORE_PILL_TONES, STORE_SCOPES } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { surfaceSx } from "../app-store.styles";
import AppStoreAppGridComponent from "../subcomponents/AppStoreAppGrid.component";
import { AppStoreCount, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import AppStorePillComponent from "../subcomponents/AppStorePill.component";

const LIST_PARAMS = { scope: STORE_SCOPES.organization };

/** The apps the organization built for itself — each one a way to its page — and the way to build another. */
function AppStoreOrganizationComponent() {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, organizationName, createApp, reportView } = useAppStore();
  const list = useStorePagedApps(LIST_PARAMS);

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    reportView({ items: list.items, totalItems: list.totalItems });
  }, [list.items, list.totalItems, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      <Box className="loom-store-fade d-flex flex-wrap align-items-center" sx={{ ...surfaceSx, borderRadius: "18px", gap: 2, p: { xs: 2.5, md: "22px 26px" }, mb: 4 }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 44,
            height: 44,
            flex: "none",
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            backgroundColor: COLORS.ink,
            color: COLORS.textOnAccent,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {(organizationName || "").trim().charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3, color: COLORS.ink }}>
            {labels.organization.title(organizationName)}
          </Typography>
          <Typography component="p" sx={{ fontSize: 13, lineHeight: 1.45, color: COLORS.textSecondary, mt: "3px" }}>
            {labels.organization.hint}
          </Typography>
        </Box>
        {createApp && (
          <AppStorePillComponent tone={STORE_PILL_TONES.dark} size={STORE_PILL_SIZES.medium} onClick={createApp}>
            {labels.organization.build}
          </AppStorePillComponent>
        )}
      </Box>

      <Box component="section">
        <AppStoreSectionHeader title={labels.nav.organizationApps(organizationName)} trailing={list.isLoading ? null : <AppStoreCount>{labels.search.count(list.totalItems)}</AppStoreCount>} />
        <AppStoreAppGridComponent list={list} emptyText={labels.organization.empty} />
      </Box>
    </>
  );
}

export default AppStoreOrganizationComponent;

import React, { useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { enumName } from "@/features/app-engine/app-store/app-store.enums";
import { suiteKindGroupTitle } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { overlineSx, visuallyHiddenSx } from "../app-store.styles";
import { AppStoreCount, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import { SkeletonBlock, SuiteTileSkeleton } from "../subcomponents/AppStoreSkeleton.component";
import { AppStoreEmptyState, AppStoreErrorState } from "../subcomponents/AppStoreStatus.component";
import AppStoreSuiteTileComponent from "../subcomponents/AppStoreSuiteTile.component";

const SUITE_COLUMN = "col-12 col-md-6 col-xl-4";
const SKELETON_COUNT = 6;

const byUseThenOrder = (left, right) =>
  (Number(right.apps_in_use) > 0) - (Number(left.apps_in_use) > 0) ||
  (Number(left.display_order) || 0) - (Number(right.display_order) || 0) ||
  String(left.name).localeCompare(String(right.name));

/** Every suite of the store, grouped by kind (Core, business suites, industry editions), the ones in use first. */
function AppStoreAllSuitesComponent() {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, catalogs, suites, suitesLoading, hasError, retryAll, reportView } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const groups = useMemo(() => {
    const kinds = catalogs.suiteKinds.length ? catalogs.suiteKinds : [...new Map(suites.map((suite) => [enumName(suite.kind), suite.kind])).values()];

    return kinds
      .map((kind) => ({
        kind,
        suites: suites.filter((suite) => enumName(suite.kind) === enumName(kind)).sort(byUseThenOrder),
      }))
      .filter((group) => group.suites.length > 0);
  }, [catalogs.suiteKinds, suites]);

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    reportView({ items: suites, totalItems: suites.length });
  }, [suites, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      <Box className="loom-store-fade" sx={{ mb: 3 }}>
        <AppStoreSectionHeader
          component="h1"
          pageTitle
          title={labels.suites.title}
          trailing={suites.length > 0 ? <AppStoreCount>{labels.suites.count(suites.length)}</AppStoreCount> : null}
        />
        <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.45, color: COLORS.textSecondary, maxWidth: 620, mt: -0.75 }}>
          {labels.suites.subtitle}
        </Typography>
      </Box>

      {suitesLoading && suites.length === 0 && (
        <Box role="status" aria-busy="true">
          <Box component="span" sx={visuallyHiddenSx}>
            {labels.loading}
          </Box>
          <SkeletonBlock width={120} height={11} sx={{ mb: 1.5 }} />
          <div className="row g-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <div key={index} className={SUITE_COLUMN}>
                <SuiteTileSkeleton index={index} />
              </div>
            ))}
          </div>
        </Box>
      )}
      {hasError && !suitesLoading && suites.length === 0 && <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={retryAll} />}
      {!suitesLoading && !hasError && suites.length === 0 && <AppStoreEmptyState text={labels.suites.empty} />}

      {groups.map((group) => (
        <Box component="section" key={enumName(group.kind)} sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ ...overlineSx, mb: 1.5 }}>
            {suiteKindGroupTitle(labels, group.kind)}
          </Typography>
          <div className="row g-3">
            {group.suites.map((suite, index) => (
              <div key={suite.slug} className={SUITE_COLUMN}>
                <AppStoreSuiteTileComponent suite={suite} withTagline index={index} />
              </div>
            ))}
          </div>
        </Box>
      ))}
    </>
  );
}

export default AppStoreAllSuitesComponent;

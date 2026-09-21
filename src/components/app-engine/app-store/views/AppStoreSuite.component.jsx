import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import fetchAllPages from "@/services/utils/fetchAllPages";
import { STORE_PILL_SIZES, STORE_PILL_TONES, enumName } from "@/features/app-engine/app-store/app-store.enums";
import { categoryTitle, isUsable, priceText, suiteKindTitle } from "@/features/app-engine/app-store/app-store.format";
import { STORE_QUERY } from "@/features/app-engine/app-store/app-store.routes";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { appChipSx, chipSx, overlineSx, surfaceSx, visuallyHiddenSx } from "../app-store.styles";
import AppStoreAppGlyphComponent from "../subcomponents/AppStoreAppGlyph.component";
import AppStoreAppGridComponent from "../subcomponents/AppStoreAppGrid.component";
import { AppStoreCount, AppStorePageTitle, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import AppStorePillComponent from "../subcomponents/AppStorePill.component";
import { HeaderSkeleton, SkeletonBlock } from "../subcomponents/AppStoreSkeleton.component";
import { AppStoreEmptyState, AppStoreErrorState } from "../subcomponents/AppStoreStatus.component";
import AppStoreSuiteGlyphComponent from "../subcomponents/AppStoreSuiteGlyph.component";

const LOADING_LIST = { items: [], totalItems: 0, hasMore: false, isLoading: true, isLoadingMore: false, hasError: false, loadMore: () => {}, reload: () => {} };

// The suite page while it loads: its header panel, then the grid's own skeleton cards.
function SuiteSkeleton({ label }) {
  return (
    <Box role="status" aria-busy="true">
      <Box component="span" sx={visuallyHiddenSx}>
        {label}
      </Box>
      <Box className="d-flex flex-wrap align-items-start gap-4" sx={{ ...surfaceSx, p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
        <Box sx={{ flex: "1 1 320px", minWidth: 0 }}>
          <HeaderSkeleton glyph={64} action />
        </Box>
        <Box className="d-flex flex-column gap-2" sx={{ flex: "0 1 200px", minWidth: 170 }}>
          <SkeletonBlock width="60%" height={11} />
          <SkeletonBlock height={6} radius="3px" />
        </Box>
      </Box>
      <SkeletonBlock width={160} height={16} sx={{ mb: 2 }} />
      <AppStoreAppGridComponent list={LOADING_LIST} />
    </Box>
  );
}

/**
 * A suite's own page: what it is and costs, how much of it the organization already uses, the apps
 * already in its hub (each one a way to its page), and the ones it can still add — filterable by
 * category (`?category=`).
 */
function AppStoreSuiteComponent({ slug }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { appSuiteService, appStoreService } = useAppEngineSDK();
  const { labels, storePaths, catalogs, revision, accessOf, isRemoved, acquire, reportView } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [suite, setSuite] = useState(null);
  const [apps, setApps] = useState([]);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const categoryFilter = searchParams.get(STORE_QUERY.category) || "";
  const visibleApps = apps.filter((app) => !isRemoved(app));
  const yours = visibleApps.filter((app) => isUsable(accessOf(app)));
  const missing = visibleApps.filter((app) => !isUsable(accessOf(app)));
  // The counts are the backend's (they include members the store does not list, such as private apps
  // the organization owns); the lists below are the store's own apps of the suite.
  const total = Number(suite?.apps_total ?? visibleApps.length) || 0;
  const inUse = Number(suite?.apps_in_use ?? yours.length) || 0;
  const coverage = Number(suite?.coverage_pct ?? (total ? Math.round((inUse / total) * 100) : 0));
  const price = priceText(labels, suite?.pricing);
  // The grid lists what the organization can still add, or the whole suite once it has everything;
  // the category chips only offer categories that grid actually contains.
  const gridSource = missing.length > 0 ? missing : visibleApps;
  const presentCategories = useMemo(() => {
    const names = new Set(gridSource.map((app) => enumName(app.category)));
    return catalogs.categories.filter((category) => names.has(category.name));
  }, [gridSource, catalogs.categories]);
  const gridApps = gridSource.filter((app) => !categoryFilter || enumName(app.category) === categoryFilter);
  const gridList = { items: gridApps, totalItems: gridApps.length, hasMore: false, isLoading: false, isLoadingMore: false, hasError: false, loadMore: () => {}, reload: () => {} };

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const load = async () => {
    const [suiteResponse, appsResponse] = await Promise.all([
      appSuiteService.getBySlug({ slug }),
      fetchAllPages((params) => appStoreService.getApps(params), { suite: slug }),
    ]);
    const found = suiteResponse?.success ? suiteResponse.result?.items?.[0] : null;

    setIsLoading(false);

    if (!found) {
      setSuite(null);
      setLoadError(suiteResponse?.success || suiteResponse?.status === 404 ? "not-found" : "failed");
      return;
    }

    setSuite(found);
    setApps(appsResponse?.success ? appsResponse.result.items : []);
    setLoadError(appsResponse?.success ? null : "failed");
  };

  const setCategory = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set(STORE_QUERY.category, name);
    else next.delete(STORE_QUERY.category);
    setSearchParams(next, { replace: true });
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, revision]);

  useEffect(() => {
    reportView({ suite, items: gridApps, totalItems: visibleApps.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suite, apps, categoryFilter, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (isLoading && (!suite || suite.slug !== slug)) {
    return <SuiteSkeleton label={labels.loading} />;
  }

  if (!suite) {
    return loadError === "not-found" ? (
      <AppStoreEmptyState text={labels.suite.notFound} />
    ) : (
      <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={load} />
    );
  }

  return (
    <>
      <Box className="loom-store-fade d-flex flex-wrap align-items-start" sx={{ ...surfaceSx, borderRadius: "18px", gap: { xs: 2.5, md: 3.25 }, p: { xs: 2.5, md: "26px 28px" }, mb: 3 }}>
        <AppStoreSuiteGlyphComponent suite={suite} size={64} />
        <Box sx={{ flex: "1 1 260px", minWidth: 0 }}>
          <Typography component="p" sx={{ ...overlineSx, mb: 0.75 }}>
            {suiteKindTitle(labels, suite.kind)}
          </Typography>
          <AppStorePageTitle>{suite.name}</AppStorePageTitle>
          <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.45, color: COLORS.textSecondary, mt: 1, mb: 2, maxWidth: 560 }}>
            {suite.description || suite.tagline}
          </Typography>
          <Box className="d-flex flex-wrap align-items-center gap-3">
            {missing.length > 0 ? (
              <AppStorePillComponent tone={STORE_PILL_TONES.accent} size={STORE_PILL_SIZES.large} onClick={() => acquire({ suite })}>
                {price ? labels.suite.getSuite(price) : labels.suite.getSuiteFree}
              </AppStorePillComponent>
            ) : (
              <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.large} disabled>
                {labels.suite.complete}
              </AppStorePillComponent>
            )}
            <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
              {labels.suite.summary(total, inUse)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: "0 1 200px", minWidth: 170 }}>
          <Box className="d-flex justify-content-between" sx={{ mb: 0.75 }}>
            <Typography component="span" sx={{ fontSize: 12, color: COLORS.textTertiary }}>
              {labels.suite.coverage}
            </Typography>
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{`${coverage}%`}</Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: "3px", backgroundColor: COLORS.track, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${coverage}%`, borderRadius: "3px", backgroundColor: suite.color || COLORS.accent, transition: "width 300ms ease" }} />
          </Box>
          {missing.length > 0 && (
            <Typography component="p" sx={{ fontSize: 12, color: COLORS.textSecondary, mt: 1 }}>
              {labels.suite.missing(missing.length)}
            </Typography>
          )}
        </Box>
      </Box>

      {yours.length > 0 && missing.length > 0 && (
        <Box className="d-flex flex-wrap align-items-center gap-2" sx={{ mb: 3 }}>
          <Typography component="span" sx={{ fontSize: 12, color: COLORS.textTertiary, mr: 0.5 }}>
            {labels.suite.alreadyInHub(yours.length)}
          </Typography>
          {yours.map((app) => (
            <Box key={app.slug} component={RouterLink} to={storePaths.app(app.slug)} sx={appChipSx}>
              <AppStoreAppGlyphComponent app={app} size={22} />
              {app.name}
            </Box>
          ))}
        </Box>
      )}

      {presentCategories.length > 1 && (
        <Box className="d-flex flex-wrap align-items-center gap-2" sx={{ mb: 2.5 }} role="group" aria-label={labels.suite.categoryFilter}>
          <Typography component="span" sx={{ fontSize: 12, color: COLORS.textTertiary, mr: 0.5 }}>
            {labels.suite.categoryFilter}
          </Typography>
          <Box component="button" type="button" aria-pressed={!categoryFilter} onClick={() => setCategory("")} sx={chipSx(!categoryFilter)}>
            {labels.suite.allCategories}
          </Box>
          {presentCategories.map((category) => (
            <Box
              key={category.key}
              component="button"
              type="button"
              aria-pressed={categoryFilter === category.name}
              onClick={() => setCategory(category.name)}
              sx={chipSx(categoryFilter === category.name)}
            >
              {categoryTitle(labels, category)}
            </Box>
          ))}
        </Box>
      )}

      <Box component="section">
        <AppStoreSectionHeader
          title={missing.length > 0 ? labels.suite.appsYouCanAdd : labels.suite.appsInSuite}
          trailing={<AppStoreCount>{labels.suites.appsCount(gridApps.length)}</AppStoreCount>}
        />
        <AppStoreAppGridComponent list={gridList} emptyText={labels.suite.noApps} />
      </Box>
    </>
  );
}

export default AppStoreSuiteComponent;

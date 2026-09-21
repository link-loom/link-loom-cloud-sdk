import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useStorePagedApps from "@/features/app-engine/app-store/useStorePagedApps.hook";
import { STORE_SCOPES } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_VIEWS } from "@/features/app-engine/app-store/app-store.routes";
import { textLinkSx } from "../app-store.styles";
import AppStoreAppGridComponent from "../subcomponents/AppStoreAppGrid.component";
import { AppStoreCount, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import { SkeletonBlock, SuiteTileSkeleton } from "../subcomponents/AppStoreSkeleton.component";
import AppStoreSpotlightCardComponent from "../subcomponents/AppStoreSpotlightCard.component";
import AppStoreSuggestedCardComponent from "../subcomponents/AppStoreSuggestedCard.component";
import AppStoreSuiteTileComponent from "../subcomponents/AppStoreSuiteTile.component";

const LIST_PARAMS = { scope: STORE_SCOPES.all };
const SUITE_COLUMN = "col-12 col-md-6 col-xl-4";
const SUITE_SKELETON_COUNT = 3;

function HomeSkeleton() {
  return (
    <>
      <Box className="row g-3" sx={{ mb: 5 }} aria-hidden="true">
        <div className="col-12 col-xl-7">
          <SkeletonBlock height={236} radius="18px" />
        </div>
        <div className="col-12 col-xl-5">
          <SkeletonBlock height={236} radius="18px" index={1} />
        </div>
      </Box>
      <Box sx={{ mb: 5 }} aria-hidden="true">
        <SkeletonBlock width={220} height={16} sx={{ mb: 2 }} />
        <div className="row g-3">
          {Array.from({ length: SUITE_SKELETON_COUNT }, (_, index) => (
            <div key={index} className={SUITE_COLUMN}>
              <SuiteTileSkeleton index={index} />
            </div>
          ))}
        </div>
      </Box>
    </>
  );
}

/**
 * The store's front page (`store/home`): the Featured banner (`spotlight`) beside "Suggested for you"
 * (`suggested`, every app the store features), the highlighted suites, then every app in the store,
 * loading page after page as the person scrolls. While the home loads it draws its skeleton.
 */
function AppStoreDiscoverComponent() {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { appStoreService } = useAppEngineSDK();
  const { labels, facets, revision, navigateTo, reportView } = useAppStore();
  const list = useStorePagedApps(LIST_PARAMS);

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [home, setHome] = useState(null);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [homeLoading, setHomeLoading] = useState(true);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const loadHome = async () => {
    const response = await appStoreService.getHome();

    setHomeLoading(false);

    if (!response?.success) {
      return;
    }

    setHome(response.result);
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    loadHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  useEffect(() => {
    reportView({ items: list.items, totalItems: list.totalItems });
  }, [list.items, list.totalItems, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const spotlight = home?.spotlight || null;
  const suggested = Array.isArray(home?.suggested) ? home.suggested : [];
  const suites = Array.isArray(home?.suites) ? home.suites : [];
  const suitesTotal = Number(facets?.suites_total) || suites.length;

  return (
    <>
      {homeLoading && !home && <HomeSkeleton />}

      {(spotlight || suggested.length > 0) && (
        <Box className="row g-3" sx={{ mb: 5 }}>
          {spotlight && (
            <div className={suggested.length > 0 ? "col-12 col-xl-7" : "col-12"}>
              <AppStoreSpotlightCardComponent app={spotlight} />
            </div>
          )}
          {suggested.length > 0 && (
            <div className={spotlight ? "col-12 col-xl-5" : "col-12"}>
              <AppStoreSuggestedCardComponent apps={suggested} />
            </div>
          )}
        </Box>
      )}

      {suites.length > 0 && (
        <Box component="section" sx={{ mb: 5 }}>
          <AppStoreSectionHeader
            title={labels.discover.browseSuites}
            trailing={
              <Box component="button" type="button" onClick={() => navigateTo(STORE_VIEWS.suites)} sx={{ ...textLinkSx, fontSize: 13, fontWeight: 500 }}>
                {labels.discover.seeAllSuites(suitesTotal)}
              </Box>
            }
          />
          <div className="row g-3">
            {suites.map((suite, index) => (
              <div key={suite.slug} className={SUITE_COLUMN}>
                <AppStoreSuiteTileComponent suite={suite} withTagline index={index} />
              </div>
            ))}
          </div>
        </Box>
      )}

      <Box component="section">
        <AppStoreSectionHeader
          title={labels.discover.title}
          trailing={list.totalItems > 0 ? <AppStoreCount>{labels.discover.showing(list.items.length, list.totalItems)}</AppStoreCount> : null}
        />
        <AppStoreAppGridComponent list={list} emptyText={labels.discover.empty} endText={labels.discover.end} />
      </Box>
    </>
  );
}

export default AppStoreDiscoverComponent;

import React, { useEffect, useMemo } from "react";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useStorePagedApps from "@/features/app-engine/app-store/useStorePagedApps.hook";
import { AppStoreCount, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import AppStoreAppGridComponent from "../subcomponents/AppStoreAppGrid.component";

/** "Results for …": the store's search, one row per app, paged like every other list. */
function AppStoreSearchResultsComponent({ query }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, reportView } = useAppStore();
  const params = useMemo(() => ({ search: query }), [query]);
  const list = useStorePagedApps(params);

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
    <section>
      <AppStoreSectionHeader
        component="h1"
        title={labels.search.resultsFor(query)}
        trailing={list.isLoading ? null : <AppStoreCount>{labels.search.count(list.totalItems)}</AppStoreCount>}
      />
      <AppStoreAppGridComponent list={list} asList emptyText={labels.search.none(query)} emptyHint={labels.search.noneHint} />
    </section>
  );
}

export default AppStoreSearchResultsComponent;

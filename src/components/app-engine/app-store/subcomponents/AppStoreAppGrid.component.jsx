import React from "react";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useInfiniteScroll from "@/features/app-engine/app-store/useInfiniteScroll.hook";
import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { surfaceSx, visuallyHiddenSx } from "../app-store.styles";
import AppStoreAppCardComponent from "./AppStoreAppCard.component";
import AppStoreAppRowComponent from "./AppStoreAppRow.component";
import AppStorePillComponent from "./AppStorePill.component";
import { AppCardSkeleton, AppRowSkeleton } from "./AppStoreSkeleton.component";
import { AppStoreEmptyState, AppStoreErrorState } from "./AppStoreStatus.component";

// Bootstrap columns: one card on a phone, two from md, three from xl — a card needs ~260px for a full app name.
const CARD_COLUMN = "col-12 col-md-6 col-xl-4";
const SKELETON_COUNT = 6;
const MORE_SKELETON_COUNT = 3;
const ROW_SKELETON_COUNT = 5;

function CardSkeletons({ count, label }) {
  return (
    <Box role="status" aria-busy="true">
      <Box component="span" sx={visuallyHiddenSx}>
        {label}
      </Box>
      <div className="row g-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={CARD_COLUMN}>
            <AppCardSkeleton index={index} />
          </div>
        ))}
      </div>
    </Box>
  );
}

/**
 * A grid of app cards — or, with `asList`, one card of rows, for search results — over one paged
 * list (`useStorePagedApps`). While a page loads the grid draws skeletons of the cards (or rows) it is
 * about to show, the next page included. The next page loads when the end of the list scrolls near;
 * "Show more" does the same for keyboards, screen readers and browsers without IntersectionObserver.
 * Apps deleted a moment ago are left out. `endText` closes a list that has been scrolled to its end.
 */
function AppStoreAppGridComponent({ list, asList = false, emptyText, emptyHint, emptyAction, endText }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, scrollRoot, isRemoved } = useAppStore();
  const sentinelRef = useInfiniteScroll({
    root: scrollRoot,
    onReach: list.loadMore,
    enabled: list.hasMore && !list.isLoading && !list.isLoadingMore && !list.hasError,
    watch: list.items.length,
  });

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const items = list.items.filter((app) => !isRemoved(app));

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (list.isLoading && asList) {
    return (
      <Box role="status" aria-busy="true" sx={{ ...surfaceSx, overflow: "hidden" }}>
        <Box component="span" sx={visuallyHiddenSx}>
          {labels.loading}
        </Box>
        {Array.from({ length: ROW_SKELETON_COUNT }, (_, index) => (
          <AppRowSkeleton key={index} index={index} divided={index > 0} />
        ))}
      </Box>
    );
  }

  if (list.isLoading) {
    return <CardSkeletons count={SKELETON_COUNT} label={labels.loading} />;
  }

  if (list.hasError && items.length === 0) {
    return <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={list.reload} />;
  }

  if (items.length === 0) {
    return <AppStoreEmptyState text={emptyText} hint={emptyHint} action={emptyAction} />;
  }

  return (
    <>
      {asList ? (
        <Box sx={{ ...surfaceSx, overflow: "hidden" }}>
          {items.map((app, index) => (
            <AppStoreAppRowComponent key={app.id || app.slug} app={app} divided index={index} />
          ))}
        </Box>
      ) : (
        <div className="row g-3">
          {items.map((app, index) => (
            <div key={app.id || app.slug} className={CARD_COLUMN}>
              <AppStoreAppCardComponent app={app} index={index % 25} />
            </div>
          ))}
        </div>
      )}

      {list.isLoadingMore && (
        <Box sx={{ mt: asList ? 0 : 2 }}>
          {asList ? (
            <Box role="status" aria-busy="true" sx={{ ...surfaceSx, overflow: "hidden", mt: 1.5 }}>
              <Box component="span" sx={visuallyHiddenSx}>
                {labels.discover.loadingMore}
              </Box>
              {Array.from({ length: MORE_SKELETON_COUNT }, (_, index) => (
                <AppRowSkeleton key={index} index={index} divided={index > 0} />
              ))}
            </Box>
          ) : (
            <CardSkeletons count={MORE_SKELETON_COUNT} label={labels.discover.loadingMore} />
          )}
        </Box>
      )}

      <div ref={sentinelRef} aria-hidden="true" />

      <Box className="d-flex flex-column align-items-center gap-2" sx={{ mt: 3 }}>
        {list.hasError && <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={list.loadMore} />}
        {list.hasMore && !list.isLoadingMore && !list.hasError && (
          <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.medium} onClick={list.loadMore}>
            {labels.discover.showMore}
          </AppStorePillComponent>
        )}
        {endText && !list.hasMore && list.totalItems > 0 && (
          <Typography component="p" sx={{ fontSize: 13, color: COLORS.textTertiary }}>
            {endText}
          </Typography>
        )}
      </Box>
    </>
  );
}

export default AppStoreAppGridComponent;

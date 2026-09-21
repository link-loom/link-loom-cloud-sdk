import { useCallback, useEffect, useRef, useState } from "react";

import { useAppEngineSDK } from "../context/AppEngineSDK.context";

/**
 * One list of the App Store (`store/apps`), paged the Link Loom way: the first page when the filters
 * change, then the next one each time `loadMore` runs — the Discover grid calls it from its scroll
 * sentinel and its "Show more" button. The page size is the backend's default.
 *
 * `params` are the store filters (`search`, `category`, `suite`, `scope`, `sort`); pass `enabled: false`
 * while a screen does not know its filters yet.
 */
export default function useStorePagedApps(params, { enabled = true } = {}) {
  // Hooks
  const { appStoreService } = useAppEngineSDK();

  // Models
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // UI states
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Configs
  const paramsKey = JSON.stringify(params || {});
  const requestRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Component Functions
  const loadPage = useCallback(
    async (nextPage, { append }) => {
      const request = ++requestRef.current;
      const response = await appStoreService.getApps({ ...JSON.parse(paramsKey), page: nextPage });

      if (request !== requestRef.current) {
        return;
      }

      if (!response?.success) {
        setHasError(true);
        return;
      }

      const pageItems = Array.isArray(response.result?.items) ? response.result.items : [];
      setItems((current) => {
        if (!append) return pageItems;
        const known = new Set(current.map((item) => item.id));
        return [...current, ...pageItems.filter((item) => !known.has(item.id))];
      });
      setTotalItems(Number(response.result?.totalItems) || 0);
      setTotalPages(Number(response.result?.totalPages) || 0);
      setPage(nextPage);
      setHasError(false);
    },
    [appStoreService, paramsKey],
  );

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    await loadPage(1, { append: false });
    setIsLoading(false);
  }, [enabled, loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || isLoading || page >= totalPages) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    await loadPage(page + 1, { append: true });
    loadingMoreRef.current = false;
    setIsLoadingMore(false);
  }, [isLoading, page, totalPages, loadPage]);

  // Lifecycle
  useEffect(() => {
    setItems([]);
    setPage(0);
    setTotalPages(0);
    setTotalItems(0);
    reload();
  }, [reload]);

  return {
    items,
    totalItems,
    hasMore: page < totalPages,
    isLoading,
    isLoadingMore,
    hasError,
    loadMore,
    reload,
  };
}

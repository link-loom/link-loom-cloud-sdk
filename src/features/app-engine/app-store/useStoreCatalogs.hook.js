import { useCallback, useEffect, useState } from "react";

import { useAppEngineSDK } from "../context/AppEngineSDK.context";
import { catalogEntries } from "./app-store.enums";

/**
 * The store's closed values (`GET /app-engine/store/catalogs`), loaded once per backend and kept for
 * the session: they change with a deploy, not while someone browses. Each catalog comes back as the
 * list of its entries in their declared order, `{ key, id, name, title, color }`.
 */
const cache = new Map();

const readCatalogs = (result) => ({
  categories: catalogEntries(result?.categories),
  scopes: catalogEntries(result?.store_scopes),
  sorts: catalogEntries(result?.store_sorts),
  accessStates: catalogEntries(result?.access_states),
  pricingModels: catalogEntries(result?.pricing_models),
  mediaTypes: catalogEntries(result?.media_types),
  suiteKinds: catalogEntries(result?.suite_kinds),
});

const EMPTY = readCatalogs(null);

export default function useStoreCatalogs() {
  // Hooks
  const { appStoreService } = useAppEngineSDK();
  const cacheKey = appStoreService?.serviceEndpoints?.baseUrl || "";

  // Models
  const [catalogs, setCatalogs] = useState(() => cache.get(cacheKey) || EMPTY);

  // UI states
  const [isLoading, setIsLoading] = useState(!cache.has(cacheKey));
  const [hasError, setHasError] = useState(false);

  // Component Functions
  const load = useCallback(async () => {
    if (cache.has(cacheKey)) {
      setCatalogs(cache.get(cacheKey));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const response = await appStoreService.getCatalogs();

    if (!response?.success) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const next = readCatalogs(response.result);
    cache.set(cacheKey, next);
    setCatalogs(next);
    setHasError(false);
    setIsLoading(false);
  }, [appStoreService, cacheKey]);

  // Lifecycle
  useEffect(() => {
    load();
  }, [load]);

  return { catalogs, isLoading, hasError, reload: load };
}

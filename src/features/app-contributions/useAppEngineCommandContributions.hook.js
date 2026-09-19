import { useCallback, useEffect, useRef, useState } from 'react';
import { compileContributionHandler } from './handler-compiler';
import { resolveIconByName } from './icon-resolver';
import {
  DEFAULT_CATALOG_TIMEOUT_MS,
  fetchContributionCatalog,
  getCatalogRetryDelay,
  isCatalogRequestCanceled,
  isRetryableCatalogError,
} from './contribution-catalog.client';

const CATALOG_PATH = '/app-engine/definition/command-contributions/';

/**
 * Fetch the Command Center contributions catalog from the App Engine backend
 * and register them into the Sommatic Command Center.
 *
 * The caller owns the coupling to `@sommatic/react-sdk` — it obtains
 * `registerCommands` and `registry` from `useCommandCenter()` and passes them
 * down. This keeps `@link-loom/cloud-sdk` free of a hard dependency on the
 * Sommatic SDK.
 *
 * Inputs:
 * - baseUrl: absolute URL of the App Engine backend.
 * - registerCommands: function(commands[]) => cleanup, from useCommandCenter.
 * - registry: optional command receipt registry, from useCommandCenter.
 * - enabled: gate registration (e.g. wait until the user is authenticated).
 * - fetchOptions: optional axios config merged into the GET request.
 * - timeoutMs: request ceiling. On timeout or failure the last registered
 *   commands stay in place and the fetch is retried later with backoff.
 *
 * Returns: { isLoading, error, items, refetch }.
 */
export default function useAppEngineCommandContributions({
  baseUrl,
  registerCommands,
  registry,
  enabled = true,
  fetchOptions,
  timeoutMs = DEFAULT_CATALOG_TIMEOUT_MS,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const unregisterRef = useRef(null);
  const abortRef = useRef(null);
  const retryTimerRef = useRef(null);
  const failedAttemptsRef = useRef(0);

  const compileItemsIntoCommands = useCallback((catalogItems) => {
    const compiled = [];
    for (const entry of catalogItems || []) {
      const appName = entry?.app_name;
      for (const contribution of entry?.contributions || []) {
        if (!contribution?.id) continue;
        const action = compileContributionHandler(contribution, { registry });
        compiled.push({
          id: contribution.id,
          label: contribution.label,
          description: contribution.description,
          schema: contribution.schema,
          isPriority: contribution.isPriority !== false,
          skills: contribution.skills || {},
          app: contribution.app || appName || 'App',
          icon: resolveIconByName(contribution.icon),
          action,
        });
      }
    }
    return compiled;
  }, [registry]);

  const clearPreviousRegistration = useCallback(() => {
    if (typeof unregisterRef.current === 'function') {
      try {
        unregisterRef.current();
      } catch (_cleanupError) {
        // Swallow: a failing cleanup should never break the next registration.
      }
      unregisterRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (!retryTimerRef.current) return;
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }, []);

  const fetchCatalog = useCallback(async () => {
    if (!baseUrl || typeof registerCommands !== 'function') return;

    clearRetryTimer();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const catalogItems = await fetchContributionCatalog({
        baseUrl,
        path: CATALOG_PATH,
        controller,
        timeoutMs,
        fetchOptions,
      });

      failedAttemptsRef.current = 0;
      setItems(catalogItems);

      const compiled = compileItemsIntoCommands(catalogItems);
      clearPreviousRegistration();

      if (compiled.length > 0) {
        const cleanup = registerCommands(compiled);
        if (typeof cleanup === 'function') {
          unregisterRef.current = cleanup;
        }
      }
    } catch (fetchError) {
      if (isCatalogRequestCanceled(fetchError)) return;

      // Keep the last registered commands; the Command Center stays usable while the catalog is unavailable.
      setError(fetchError);
      if (!isRetryableCatalogError(fetchError)) return;

      failedAttemptsRef.current += 1;
      retryTimerRef.current = setTimeout(
        () => fetchCatalogRef.current(),
        getCatalogRetryDelay(failedAttemptsRef.current),
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  }, [
    baseUrl,
    registerCommands,
    fetchOptions,
    timeoutMs,
    compileItemsIntoCommands,
    clearPreviousRegistration,
    clearRetryTimer,
  ]);

  // Keep the latest fetchCatalog accessible without listing it as an effect
  // dependency. Any reactive input that should re-trigger the fetch must be
  // added explicitly to the effect's deps below — re-fetching whenever the
  // callback identity changes is what caused an infinite request loop.
  const fetchCatalogRef = useRef(fetchCatalog);
  fetchCatalogRef.current = fetchCatalog;

  useEffect(() => {
    if (!enabled) {
      clearPreviousRegistration();
      return undefined;
    }

    failedAttemptsRef.current = 0;
    fetchCatalogRef.current();

    return () => {
      clearRetryTimer();
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      clearPreviousRegistration();
    };
  }, [enabled, baseUrl, clearPreviousRegistration, clearRetryTimer]);

  return {
    isLoading,
    error,
    items,
    refetch: fetchCatalog,
  };
}

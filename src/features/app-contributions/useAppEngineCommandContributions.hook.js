import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { compileContributionHandler } from './handler-compiler';
import { resolveIconByName } from './icon-resolver';

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
 *
 * Returns: { isLoading, error, items, refetch }.
 */
export default function useAppEngineCommandContributions({
  baseUrl,
  registerCommands,
  registry,
  enabled = true,
  fetchOptions,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const unregisterRef = useRef(null);
  const abortRef = useRef(null);

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

  const fetchCatalog = useCallback(async () => {
    if (!baseUrl || typeof registerCommands !== 'function') return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const url = `${String(baseUrl).replace(/\/+$/, '')}${CATALOG_PATH}`;
      const response = await axios.get(url, {
        signal: controller.signal,
        ...(fetchOptions || {}),
      });

      const catalogItems = response?.data?.result?.items || response?.data?.items || [];
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
      if (fetchError?.name === 'CanceledError' || fetchError?.name === 'AbortError') return;
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, registerCommands, fetchOptions, compileItemsIntoCommands, clearPreviousRegistration]);

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

    fetchCatalogRef.current();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      clearPreviousRegistration();
    };
  }, [enabled, baseUrl, clearPreviousRegistration]);

  return {
    isLoading,
    error,
    items,
    refetch: fetchCatalog,
  };
}

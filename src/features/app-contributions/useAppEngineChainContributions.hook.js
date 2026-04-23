import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { compileChainAppEmbed } from './chain-compiler';
import { dispatchEmbedToCommandCenter } from './command-center-dispatch';

const CATALOG_PATH = '/app-engine/definition/chain-contributions/';
const LOG_PREFIX = '[CC-CHAIN hook]';

/**
 * Fetch the chain contributions catalog from the backend and install a single
 * global `sommatic:app:output` listener that routes each output to any
 * matching chains.
 *
 * A chain matches when `outputPayload` comes from an app whose slug equals
 * the chain's `source_app_slug`. The compiled `appEmbed` descriptor is then
 * dispatched as `sommatic:open-command-center`, which the webapp host listens
 * on to open the target app in modal/fullscreen/command-center mode.
 *
 * Inputs:
 * - baseUrl: absolute URL of the Link Loom Cloud Backend (same baseUrl used
 *   by `useAppEngineCommandContributions`).
 * - enabled: gate registration; when false the listener is not installed.
 * - fetchOptions: optional axios config.
 *
 * Returns: `{ isLoading, error, items, refetch }`.
 */
export default function useAppEngineChainContributions({
  baseUrl,
  enabled = true,
  fetchOptions,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const chainsRef = useRef([]);
  const abortRef = useRef(null);
  const listenerInstalledRef = useRef(false);

  const fetchCatalog = useCallback(async () => {
    if (!baseUrl) return;

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

      const flatChains = [];
      for (const entry of catalogItems) {
        for (const chain of entry?.chains || []) {
          flatChains.push(chain);
        }
      }
      chainsRef.current = flatChains;
      console.log(`${LOG_PREFIX} catalog loaded with ${flatChains.length} chain(s)`, flatChains);
    } catch (fetchError) {
      if (fetchError?.name === 'CanceledError' || fetchError?.name === 'AbortError') return;
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, fetchOptions]);

  useEffect(() => {
    if (!enabled) {
      chainsRef.current = [];
      return undefined;
    }

    fetchCatalog();

    if (listenerInstalledRef.current) {
      return () => {
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
      };
    }

    const handleOutput = (event) => {
      const detail = event?.detail || {};
      const sourceAppSlug = detail.appSlug;
      const outputPayload = detail.outputPayload;

      console.log(`${LOG_PREFIX} received sommatic:app:output`, { sourceAppSlug, outputPayload });

      if (!sourceAppSlug || !outputPayload) {
        console.warn(`${LOG_PREFIX} skipped: missing sourceAppSlug or outputPayload`);
        return;
      }

      const matches = chainsRef.current.filter(
        (chain) => chain?.source_app_slug === sourceAppSlug,
      );

      console.log(
        `${LOG_PREFIX} ${matches.length} matching chain(s) out of ${chainsRef.current.length} total`,
        matches.map((c) => ({ id: c.id, source: c.source_app_slug, target: c.target?.app_slug })),
      );

      for (const chain of matches) {
        const appEmbed = compileChainAppEmbed(chain, outputPayload);
        if (!appEmbed?.app_slug) {
          console.warn(`${LOG_PREFIX} chain "${chain.id}" compiled without app_slug, skipping`, appEmbed);
          continue;
        }

        const launchMode = appEmbed.launch_mode || 'command-center';
        console.log(`${LOG_PREFIX} chain "${chain.id}" compiled → launch_mode=${launchMode}`, appEmbed);

        if (launchMode === 'command-center') {
          dispatchEmbedToCommandCenter({
            appSlug: appEmbed.app_slug,
            routePath: appEmbed.route_path || '/',
            inputPayload: appEmbed.input_payload || {},
            parentSessionId: null,
            viewState: null,
          });
          continue;
        }

        console.log(`${LOG_PREFIX} dispatching sommatic:open-command-center for ${launchMode} mode`);
        window.dispatchEvent(
          new CustomEvent('sommatic:open-command-center', {
            detail: { appEmbed },
          }),
        );
      }
    };

    window.addEventListener('sommatic:app:output', handleOutput);
    console.log(`${LOG_PREFIX} global sommatic:app:output listener installed`);
    listenerInstalledRef.current = true;

    return () => {
      window.removeEventListener('sommatic:app:output', handleOutput);
      listenerInstalledRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      chainsRef.current = [];
    };
  }, [enabled, fetchCatalog]);

  return {
    isLoading,
    error,
    items,
    refetch: fetchCatalog,
  };
}

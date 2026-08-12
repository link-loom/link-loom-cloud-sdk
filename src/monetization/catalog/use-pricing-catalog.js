import { useCallback, useEffect, useMemo, useState } from "react";

import PricingCatalogClient from "./catalog-client";

/**
 * usePricingCatalog — a pricing page, ready to render.
 *
 * Every cycle is fetched once and kept, so switching between monthly and annual is instant rather
 * than a round trip. The catalog chrome — headline, cycle labels, badge, FAQ — comes back with it,
 * because all of that is data on the server rather than copy in the page.
 */
export default function usePricingCatalog({
  baseUrl,
  apiKey,
  slug,
  productId,
  locale = "en",
  includeDraft = false,
  enabled = true,
} = {}) {
  const [catalog, setCatalog] = useState(null);
  const [plansByCycle, setPlansByCycle] = useState({});
  const [isLoading, setIsLoading] = useState(!!enabled);
  const [error, setError] = useState(null);

  const client = useMemo(
    () => new PricingCatalogClient({ baseUrl, apiKey, locale }),
    [baseUrl, apiKey, locale],
  );

  const refresh = useCallback(async () => {
    if (!enabled || !slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await client.getPageWithCycles({
        slug,
        productId,
        locale,
        includeDraft,
      });

      if (!page) {
        setError("This pricing page could not be loaded.");
        setCatalog(null);
        setPlansByCycle({});
        return;
      }

      setCatalog(page.catalog);
      setPlansByCycle(page.plansByCycle);
    } finally {
      setIsLoading(false);
    }
  }, [client, slug, productId, locale, includeDraft, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cycles = catalog?.cycles || [];
  const defaultCycle =
    cycles.find((entry) => entry.is_default)?.cycle || cycles[0]?.cycle || null;

  return {
    catalog,
    cycles,
    defaultCycle,
    plansByCycle,
    plansFor: (cycle) =>
      plansByCycle[cycle] || plansByCycle[defaultCycle] || [],
    isLoading,
    error,
    refresh,
  };
}

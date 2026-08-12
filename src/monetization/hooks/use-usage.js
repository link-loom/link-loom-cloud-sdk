import { useCallback, useEffect, useMemo, useState } from "react";

import PricingCatalogClient from "../catalog/catalog-client";

/**
 * useUsage — what a subject is on and what they have used this period.
 *
 * Read only. One call returns the plan, the period, the price agreed and one entry per metric with
 * used against allowed — everything a billing screen draws, without a second request.
 */
export default function useUsage({
  baseUrl,
  apiKey,
  subject,
  product,
  enabled = true,
} = {}) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(!!enabled);

  const client = useMemo(
    () => new PricingCatalogClient({ baseUrl, apiKey }),
    [baseUrl, apiKey],
  );

  const refresh = useCallback(async () => {
    if (!enabled || !subject?.identity) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const next = await client.getSubscriptionSummary({
        subjectIdentity: subject.identity,
        subjectType: subject.type,
        product,
      });

      setSummary(next);

      if (next?.subscription_id) {
        setHistory(
          await client.getBillingHistory({
            subscriptionId: next.subscription_id,
          }),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, subject?.identity, subject?.type, product, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    summary,
    metrics: summary?.metrics || [],
    history,
    hasSubscription: !!summary?.subscription_id,
    isLoading,
    refresh,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useBilling — a subject's plan and this cycle's usage, from the injected billing service.
 *
 * The two reads are independent: one failing never blanks the other section. A response that arrives
 * after a newer request started is ignored.
 */
export default function useBilling({ service, product, enabled = true } = {}) {
  const [overview, setOverview] = useState(null);
  const [usage, setUsage] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [usageError, setUsageError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !service || !product) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    setIsLoading(true);

    // Overview first: for a new customer it creates the subscription that usage then reads.
    const overviewResponse = await service.getByParameters({
      queryselector: "overview",
      product,
    });
    const usageResponse = await service.getByParameters({
      queryselector: "usage",
      product,
    });

    if (requestId !== requestRef.current) {
      return;
    }

    setOverview(overviewResponse?.success ? overviewResponse.result : null);
    setOverviewError(overviewResponse?.success ? null : overviewResponse);
    setUsage(usageResponse?.success ? usageResponse.result : null);
    setUsageError(usageResponse?.success ? null : usageResponse);
    setIsLoading(false);
  }, [service, product, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    overview,
    usage,
    overviewError,
    usageError,
    isLoading,
    refresh,
  };
}

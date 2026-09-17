import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useBillingAccess — whether the platform should let this subject in.
 *
 * Fails open on purpose: if billing cannot answer, nobody is locked out of their work. The verdict is
 * refreshed on an interval so a payment lifts a pause without a reload.
 */
export default function useBillingAccess({
  service,
  product,
  refreshIntervalMs = 5 * 60 * 1000,
  enabled = true,
} = {}) {
  const [access, setAccess] = useState({
    allowed: true,
    status: null,
    reasons: [],
  });
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !service || !product) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    const response = await service.getByParameters({
      queryselector: "access",
      product,
    });

    if (requestId !== requestRef.current) {
      return;
    }

    if (response?.success) {
      setAccess(response.result);
    }

    setIsLoading(false);
  }, [service, product, enabled]);

  useEffect(() => {
    refresh();

    if (!enabled || !refreshIntervalMs) {
      return undefined;
    }

    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs, enabled]);

  return { ...access, isLoading, refresh };
}

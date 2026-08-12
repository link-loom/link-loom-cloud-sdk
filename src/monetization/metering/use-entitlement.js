import { useCallback, useEffect, useMemo, useState } from "react";

import MeteringClient from "./metering-client";

/**
 * useEntitlement — read what a subject is allowed, without ever counting.
 *
 * READ ONLY. This is the hook to use when a screen needs to know whether to disable a button, show a
 * remaining count, or offer an upgrade. It calls the check endpoint, which decides without writing
 * anything. Use `useMetering` when the thing has actually happened and must be counted.
 *
 * Usage:
 *   const { allowed, used, limit, remaining, isLoading, refresh } =
 *     useEntitlement({ baseUrl, apiKey, product, subject, metric: "workflow.runs.monthly" });
 */
export default function useEntitlement({
  baseUrl,
  apiKey,
  product,
  subject,
  metric,
  enabled = true,
} = {}) {
  const [decision, setDecision] = useState(null);
  const [isLoading, setIsLoading] = useState(!!enabled);

  const client = useMemo(
    () => new MeteringClient({ baseUrl, apiKey, product, subject }),
    [baseUrl, apiKey, product, subject?.identity, subject?.type],
  );

  const refresh = useCallback(async () => {
    if (!enabled || !metric || !subject?.identity) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const next = await client.check({ metric });
      setDecision(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [client, metric, subject?.identity, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    allowed: decision?.allowed ?? null,
    used: decision?.used ?? null,
    limit: decision?.limit ?? null,
    remaining: decision?.remaining ?? null,
    warning: decision?.warning ?? null,
    reason: decision?.reason ?? null,
    isDegraded: !!decision?.degraded,
    decision,
    isLoading,
    refresh,
  };
}

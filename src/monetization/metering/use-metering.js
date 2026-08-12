import { useCallback, useMemo, useRef, useState } from "react";

import MeteringClient from "./metering-client";

/**
 * useMetering — reporting usage from a React surface.
 *
 * `report()` COUNTS. Calling it during render, or inside an effect with unstable dependencies, will
 * quietly drain a customer's allowance. Reach for `useEntitlement` when all you want is to read what
 * they are allowed and disable a button.
 *
 * Usage:
 *   const { report, check, lastDecision, isReporting } = useMetering({ baseUrl, apiKey, product, subject });
 *   const onRun = async () => {
 *     const decision = await report({ metric: "workflow.runs.monthly" });
 *     if (!decision.allowed) { showUpgradePrompt(decision); return; }
 *     await runWorkflow();
 *   };
 */
export default function useMetering({
  baseUrl,
  apiKey,
  product,
  subject,
  failureMode,
} = {}) {
  const [lastDecision, setLastDecision] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const inFlight = useRef(0);

  const client = useMemo(
    () =>
      new MeteringClient({
        baseUrl,
        apiKey,
        product,
        subject,
        failureMode,
      }),
    [baseUrl, apiKey, product, subject?.identity, subject?.type, failureMode],
  );

  const run = useCallback(
    async (method, args) => {
      const ticket = ++inFlight.current;
      setIsReporting(true);

      try {
        const decision = await client[method](args);

        // A slower earlier call must not overwrite a newer answer.
        if (ticket === inFlight.current) {
          setLastDecision(decision);
        }

        return decision;
      } finally {
        if (ticket === inFlight.current) {
          setIsReporting(false);
        }
      }
    },
    [client],
  );

  const report = useCallback((args) => run("report", args), [run]);
  const check = useCallback((args) => run("check", args), [run]);

  return { report, check, lastDecision, isReporting, client };
}

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useBillingProfile — the fiscal details printed on a subject's invoices, and saving them.
 *
 * A rejected save returns the field problems (`fields`) so the form can point at each one.
 */
export default function useBillingProfile({ service, enabled = true } = {}) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isSaving, setIsSaving] = useState(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !service) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    setIsLoading(true);

    const response = await service.getByParameters({
      queryselector: "profile",
    });

    if (requestId !== requestRef.current) {
      return;
    }

    setProfile(response?.success ? response.result?.profile || null : null);
    setError(response?.success ? null : response);
    setIsLoading(false);
  }, [service, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (nextProfile) => {
      setIsSaving(true);
      const response = await service.saveProfile({ profile: nextProfile });
      setIsSaving(false);

      if (response?.success) {
        setProfile(response.result);
      }

      return response;
    },
    [service],
  );

  return { profile, error, isLoading, isSaving, save, refresh };
}

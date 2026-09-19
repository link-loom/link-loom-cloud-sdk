import { useCallback, useEffect, useState } from "react";

export default function useStorageUsage(sdk) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!sdk?.files) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setUsage(await sdk.files.usage());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}

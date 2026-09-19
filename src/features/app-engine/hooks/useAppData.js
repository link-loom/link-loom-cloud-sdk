import { useCallback, useEffect, useRef, useState } from "react";

// Lists a collection through sdk.data and refreshes on local mutations, completed syncs and, when
// the query names a refId, realtime record signals.
export default function useAppData(sdk, query) {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryKey = JSON.stringify(query || {});
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const { collection, ...options } = JSON.parse(queryKey);
    if (!sdk?.data || !collection) {
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const result = await sdk.data.list(collection, options);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(result.items);
      setTotalItems(result.totalItems);
      setFromCache(result.fromCache);
      setError(null);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [sdk, queryKey]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sdk?.data) {
      return undefined;
    }

    let previous = sdk.data.status();
    const unsubscribeStatus = sdk.data.onStatusChange((next) => {
      const changed = next.pending !== previous.pending || next.lastSyncAt !== previous.lastSyncAt || next.conflicts !== previous.conflicts;
      previous = next;
      if (changed) {
        refresh();
      }
    });

    const { collection, refId } = JSON.parse(queryKey);
    const unsubscribeRecords = sdk.data.subscribe(refId ? { collection, refId } : { collection }, () => refresh());

    return () => {
      unsubscribeStatus();
      unsubscribeRecords();
    };
  }, [sdk, queryKey, refresh]);

  return { items, totalItems, fromCache, loading, error, refresh };
}

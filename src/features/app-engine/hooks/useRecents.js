import { useCallback, useEffect, useState } from "react";

const RECENTS_COLLECTION = "loom.system";
const RECENTS_KEY = "recents";
const RECENTS_SCOPE = "user-appdata";
const RECENTS_LIMIT = 50;

export default function useRecents(sdk) {
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sdk?.data) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    sdk.data
      .getKey(RECENTS_COLLECTION, RECENTS_KEY, { scope: RECENTS_SCOPE })
      .then((stored) => active && setRecents(Array.isArray(stored?.items) ? stored.items : []))
      .catch(() => active && setRecents([]))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [sdk]);

  const persist = useCallback(
    (items) => {
      setRecents(items);
      return sdk?.data?.setKey(RECENTS_COLLECTION, RECENTS_KEY, { items }, { scope: RECENTS_SCOPE });
    },
    [sdk],
  );

  const add = useCallback(
    (entry) => {
      if (!entry?.id) {
        return undefined;
      }
      const nextEntry = { ...entry, visited_at: Date.now() };
      return persist([nextEntry, ...recents.filter((item) => item.id !== entry.id)].slice(0, RECENTS_LIMIT));
    },
    [recents, persist],
  );

  const remove = useCallback((id) => persist(recents.filter((item) => item.id !== id)), [recents, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { recents, loading, add, remove, clear };
}

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Calls `onReach` when a sentinel placed after a list scrolls into view of `root` (the store's scroll
 * container), a screen before it gets there so the next page is usually in by the time it is needed.
 * Returns the sentinel's ref. Without IntersectionObserver nothing is observed and the list's own
 * "Show more" button does the work.
 *
 * `watch` is the list's length: an observer only reports changes, so a sentinel still on screen after
 * a page arrives (a tall window) would never report again. Observing afresh when the list grows makes
 * it report its current state once more.
 */
export default function useInfiniteScroll({ root, onReach, enabled, watch }) {
  const [sentinel, setSentinel] = useState(null);
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;

  useEffect(() => {
    if (!enabled || !sentinel || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachRef.current?.();
      },
      { root: root || null, rootMargin: "0px 0px 480px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, sentinel, root, watch]);

  return useCallback((node) => setSentinel(node), []);
}

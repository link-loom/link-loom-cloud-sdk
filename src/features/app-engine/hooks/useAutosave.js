import { useCallback, useEffect, useRef, useState } from "react";
import { findUploadPlaceholders, replaceUploadPlaceholders } from "../runtime/files/pending-uploads";

const hasUnresolvedUploads = (placeholders) => [...placeholders.values()].some((placeholder) => !placeholder.resolved);

// Coalesces edits into one sdk.data.update per pause (debounce) with an upper bound (maxWait).
// Updates land in the offline outbox synchronously, so a flush on pagehide only has to push the
// outbox with a keepalive request.
// A patch that references offline uploads still in the queue (`blob:` URLs) waits for them to sync, up to
// `pendingUploadMaxWaitMs`; after that, or when the page goes away, it saves with `data-pending-upload`
// markers instead of the `blob:` URLs.
export default function useAutosave(
  sdk,
  recordOrId,
  { debounceMs = 800, maxWaitMs = 5000, pendingUploadRetryMs = 1000, pendingUploadMaxWaitMs = 15000 } = {},
) {
  const recordId = typeof recordOrId === "string" ? recordOrId : recordOrId?.id;

  const [status, setStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const pendingPatchRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const maxWaitTimerRef = useRef(null);
  const uploadWaitStartedRef = useRef(null);

  const clearTimers = () => {
    clearTimeout(debounceTimerRef.current);
    clearTimeout(maxWaitTimerRef.current);
    debounceTimerRef.current = null;
    maxWaitTimerRef.current = null;
  };

  const flush = useCallback(
    async ({ force = false } = {}) => {
      clearTimers();
      const patch = pendingPatchRef.current;
      if (!patch || !sdk?.data || !recordId) {
        return null;
      }

      const placeholders = findUploadPlaceholders(patch, sdk.files);
      const now = Date.now();
      uploadWaitStartedRef.current = uploadWaitStartedRef.current ?? now;
      const isWaitingForUploads =
        !force && hasUnresolvedUploads(placeholders) && now - uploadWaitStartedRef.current < pendingUploadMaxWaitMs;

      if (isWaitingForUploads) {
        debounceTimerRef.current = setTimeout(() => flush(), pendingUploadRetryMs);
        return null;
      }

      uploadWaitStartedRef.current = null;
      pendingPatchRef.current = null;
      setStatus("saving");

      try {
        const record = await sdk.data.update(recordId, placeholders.size ? replaceUploadPlaceholders(patch, placeholders) : patch);
        setLastSavedAt(Date.now());
        setError(null);
        setStatus(sdk.data.status().online ? "saved" : "offline");
        return record;
      } catch (err) {
        setError(err);
        setStatus("error");
        return null;
      }
    },
    [sdk, recordId, pendingUploadRetryMs, pendingUploadMaxWaitMs],
  );

  const save = useCallback(
    (patch) => {
      pendingPatchRef.current = {
        ...(pendingPatchRef.current || {}),
        ...patch,
      };
      setStatus("dirty");

      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => flush(), debounceMs);

      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => flush(), maxWaitMs);
      }
    },
    [flush, debounceMs, maxWaitMs],
  );

  useEffect(() => {
    if (!sdk?.data) {
      return undefined;
    }

    const handlePageHide = () => {
      flush({ force: true });
      sdk.data.flush({ keepalive: true });
    };
    const handleUploadSynced = () => {
      if (uploadWaitStartedRef.current !== null && pendingPatchRef.current) {
        flush();
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    const unsubscribeUploads = sdk.files?.onUploadSynced?.(handleUploadSynced);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      unsubscribeUploads?.();
      flush({ force: true });
    };
  }, [sdk, flush]);

  return { save, flush, status, lastSavedAt, error };
}

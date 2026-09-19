import { useEffect, useState } from "react";

const OFFLINE_STATUS = { online: false, pending: 0, lastSyncAt: null, conflicts: 0, conflictIds: [] };

export default function useConnectivity(sdk) {
  const [status, setStatus] = useState(() => sdk?.data?.status() || OFFLINE_STATUS);

  useEffect(() => {
    if (!sdk?.data) {
      return undefined;
    }

    const refresh = () => setStatus(sdk.data.status());
    refresh();

    const unsubscribe = sdk.data.onStatusChange(setStatus);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);

    return () => {
      unsubscribe();
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, [sdk]);

  return status;
}

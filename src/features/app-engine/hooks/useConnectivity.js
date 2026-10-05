import { useEffect, useState } from "react";

const OFFLINE_STATUS = { online: false, pending: 0, lastSyncAt: null, conflicts: 0, conflictIds: [], failures: [] };

const failureKey = (failure) => `${failure.at}:${failure.op}:${failure.target_id}`;

// A status without `failures` counts as none.
const failuresOf = (status) => status.failures || [];

// The data client emits a status snapshot after every sync pass, most of which change nothing. Keeping
// the previous object on an unchanged snapshot spares every consumer a render it has no work for.
const isSameStatus = (previous, next) =>
  previous.online === next.online &&
  previous.pending === next.pending &&
  previous.lastSyncAt === next.lastSyncAt &&
  previous.conflicts === next.conflicts &&
  previous.conflictIds.length === next.conflictIds.length &&
  previous.conflictIds.every((id, index) => id === next.conflictIds[index]) &&
  failuresOf(previous).length === failuresOf(next).length &&
  failuresOf(previous).every((failure, index) => failureKey(failure) === failureKey(failuresOf(next)[index]));

export default function useConnectivity(sdk) {
  const [status, setStatus] = useState(() => sdk?.data?.status() || OFFLINE_STATUS);

  useEffect(() => {
    if (!sdk?.data) {
      return undefined;
    }

    const apply = (next) => setStatus((previous) => (isSameStatus(previous, next) ? previous : next));
    const refresh = () => apply(sdk.data.status());
    refresh();

    const unsubscribe = sdk.data.onStatusChange(apply);
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

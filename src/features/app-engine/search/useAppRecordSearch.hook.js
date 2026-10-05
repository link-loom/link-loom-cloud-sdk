import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@veripass/react-sdk";

import { getRuntimeConfig } from "../runtime/shared/runtime-config";
import { createAppSearchClient } from "./app-search.client";
import { RECORD_SEARCH_STATUSES, createRecordSearchRunner } from "./app-search.runner";

/**
 * The records of the organization's apps that match `query`, for a screen that shows them as the
 * person types (the launchpad). `hits` are results as the backend answers them, each with
 * `deep_link`. Nothing is asked while `enabled` is false or the text is too short.
 */
export default function useAppRecordSearch({ query, enabled = true, baseUrl, limit = 8, debounceMs } = {}) {
  const auth = useAuth();
  const getTokenRef = useRef(auth?.getToken);
  getTokenRef.current = auth?.getToken;
  const [state, setState] = useState({ status: RECORD_SEARCH_STATUSES.idle, hits: [] });

  const client = useMemo(
    () =>
      createAppSearchClient({
        baseUrl: baseUrl || getRuntimeConfig().loomCloudBaseUrl,
        getSession: () => getTokenRef.current?.(),
      }),
    [baseUrl],
  );
  const runner = useMemo(
    () => createRecordSearchRunner({ client, limit, debounceMs, onChange: setState }),
    [client, limit, debounceMs],
  );

  useEffect(() => () => runner.dispose(), [runner]);

  useEffect(() => {
    runner.update(enabled ? query : "");
  }, [runner, enabled, query]);

  return state;
}

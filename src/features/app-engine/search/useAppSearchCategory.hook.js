import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@veripass/react-sdk";

import { getRuntimeConfig } from "../runtime/shared/runtime-config";
import { createAppSearchClient } from "./app-search.client";
import { createAppSearchCategory } from "./app-search.category";

/**
 * The category for the host's Omnisearch, or null while there is nothing to search (no app of the
 * organization declares searchable entities, or that is not known yet). The list of contributing
 * apps is read the first time `enabled` is true (the overlay opens), so a page that never opens the
 * search never asks. Pass `getSession` or let the hook read `useAuth().getToken`.
 */
export default function useAppSearchCategory({ enabled = true, baseUrl, labels, locale, limit, basePath, onOpen } = {}) {
  const auth = useAuth();
  const getTokenRef = useRef(auth?.getToken);
  getTokenRef.current = auth?.getToken;
  const organizationId = auth?.user?.payload?.organization_id;
  const [contributes, setContributes] = useState({ organizationId: null, value: false });

  const resolvedBaseUrl = baseUrl || getRuntimeConfig().loomCloudBaseUrl;
  const client = useMemo(
    () =>
      createAppSearchClient({
        baseUrl: resolvedBaseUrl,
        getSession: () => getTokenRef.current?.(),
      }),
    [resolvedBaseUrl],
  );

  useEffect(() => {
    if (!enabled || !organizationId || contributes.organizationId === organizationId) {
      return undefined;
    }

    let cancelled = false;

    client
      .listSources()
      .then((sources) => !cancelled && setContributes({ organizationId, value: sources.length > 0 }))
      .catch(() => !cancelled && setContributes({ organizationId, value: false }));

    return () => {
      cancelled = true;
    };
  }, [enabled, organizationId, client, contributes.organizationId]);

  return useMemo(
    () =>
      contributes.value && contributes.organizationId === organizationId
        ? createAppSearchCategory({ client, labels, locale, limit, basePath, baseUrl: resolvedBaseUrl, onOpen })
        : null,
    [contributes, organizationId, client, labels, locale, limit, basePath, resolvedBaseUrl, onOpen],
  );
}

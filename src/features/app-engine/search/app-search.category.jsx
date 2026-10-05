import React from "react";
import { Search as SearchIcon } from "@mui/icons-material";

import AppIcon from "../../../components/app-engine/AppIcon.component";
import { hitContextLine, hitKey, hitRuntimePath } from "./app-search.utils";

export const APP_SEARCH_CATEGORY_ID = "app-records";
export const APP_SEARCH_LABELS = { category: "In your apps" };

// A result names its app by slug only: the app's own logo is the published SVG served for that slug.
export const APP_LOGO = { type: "svg" };

/**
 * The result of an app search as Omnisearch lists it: the app's own logo, the title and a line of
 * context under it, and on the right which app and kind of record it is.
 */
export function AppSearchHit({ hit, locale, baseUrl }) {
  return (
    <>
      <AppIcon slug={hit.app_slug} icon={APP_LOGO} baseUrl={baseUrl} size={20} />
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <span className="text-truncate">{hit.title}</span>
        {hit.subtitle && <span className="small text-white-50 text-truncate">{hit.subtitle}</span>}
      </div>
      <span className="small text-white-50 text-nowrap ms-2">{hitContextLine(hit, locale)}</span>
    </>
  );
}

/**
 * An Omnisearch category that searches the records of every app of the organization. The overlay
 * lists `search` results as they come (the backend already matched them, `serverFiltered`) and opens
 * the chosen one in its app, at the record, with `onSelect`.
 */
export const createAppSearchCategory = ({ client, labels = APP_SEARCH_LABELS, locale = "en", limit, basePath, baseUrl, onOpen }) => ({
  id: APP_SEARCH_CATEGORY_ID,
  label: labels.category,
  icon: <SearchIcon />,
  serverFiltered: true,
  search: async ({ query }) => (await client.searchRecords({ text: query, limit })).items,
  itemKey: hitKey,
  itemValue: hitKey,
  renderItem: (hit) => <AppSearchHit hit={hit} locale={locale} baseUrl={baseUrl} />,
  onSelect: (hit, navigate) => {
    const path = hitRuntimePath(hit, basePath);

    if (!path) {
      return;
    }

    onOpen?.(hit, path);
    navigate(path);
  },
});

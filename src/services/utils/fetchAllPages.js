/**
 * Every page of a Link Loom paginated collection, for the few consumers that genuinely need the
 * whole list (the launchpad, the pinned apps widget, the Command Center catalog).
 *
 * Link Loom pages with `page` (from 1) and the backend's own default `pageSize`; responses carry
 * `{ items, totalItems, totalPages, currentPage, pageSize }`. This walks `totalPages` instead of asking
 * for one huge page, so it never depends on a page size the backend may cap. `pageSize` is only sent
 * when the caller passes one.
 *
 * `service` is either a function `(params) => envelope` (e.g. `(params) => definitions.getMarketplace(params)`)
 * or a service with `getByParameters` (then `params` carries the `queryselector`).
 *
 * Resolves to the usual envelope: `{ success: true, result: { items, totalItems, totalPages } }`, or the
 * first failing page's envelope — a partial list is never passed off as the whole one.
 */
const PAGE_CEILING = 200;

const fetchPageWith = (service) => {
  if (typeof service === "function") {
    return service;
  }

  if (service && typeof service.getByParameters === "function") {
    return (params) => service.getByParameters(params);
  }

  return null;
};

export default async function fetchAllPages(service, params = {}) {
  const fetchPage = fetchPageWith(service);

  if (!fetchPage) {
    return { success: false, status: 0, message: "fetchAllPages needs a function or a service with getByParameters", result: null };
  }

  const items = [];
  let page = 1;
  let totalPages = 1;
  let totalItems = 0;

  while (page <= totalPages && page <= PAGE_CEILING) {
    const response = await fetchPage({ ...params, page });

    if (!response?.success) {
      return response || { success: false, status: 0, message: "No response", result: null };
    }

    const pageItems = Array.isArray(response.result?.items) ? response.result.items : [];
    items.push(...pageItems);

    totalItems = Number(response.result?.totalItems) || items.length;
    totalPages = Number(response.result?.totalPages) || 1;

    if (pageItems.length === 0) {
      break;
    }

    page += 1;
  }

  return { success: true, result: { items, totalItems, totalPages } };
}

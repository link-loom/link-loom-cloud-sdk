import axios from 'axios';

export const DEFAULT_CATALOG_TIMEOUT_MS = 8000;

const RETRY_BASE_DELAY_MS = 15000;
const RETRY_MAX_DELAY_MS = 120000;

export const isCatalogRequestCanceled = (error) =>
  error?.name === 'CanceledError' || error?.name === 'AbortError';

export const isRetryableCatalogError = (error) => {
  const status = error?.response?.status;
  if (!status) return true;
  return status >= 500 || status === 408 || status === 429;
};

export const getCatalogRetryDelay = (attempt) =>
  Math.min(RETRY_BASE_DELAY_MS * 2 ** Math.max(attempt - 1, 0), RETRY_MAX_DELAY_MS);

/**
 * GET a contributions catalog with a bounded timeout. The request is aborted
 * through the caller's AbortController either when the timeout elapses (the
 * rejection is then a `TimeoutError`) or when the caller aborts it (the
 * rejection is then a cancellation, see `isCatalogRequestCanceled`).
 */
export async function fetchContributionCatalog({
  baseUrl,
  path,
  controller,
  timeoutMs = DEFAULT_CATALOG_TIMEOUT_MS,
  fetchOptions,
}) {
  const url = `${String(baseUrl).replace(/\/+$/, '')}${path}`;
  let hasTimedOut = false;
  const timeoutId = setTimeout(() => {
    hasTimedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await axios.get(url, {
      ...(fetchOptions || {}),
      signal: controller.signal,
    });

    const catalogItems = response?.data?.result?.items || response?.data?.items;
    return Array.isArray(catalogItems) ? catalogItems : [];
  } catch (requestError) {
    if (!hasTimedOut) {
      throw requestError;
    }

    const timeoutError = new Error(`Contribution catalog request timed out after ${timeoutMs}ms`);
    timeoutError.name = 'TimeoutError';
    throw timeoutError;
  } finally {
    clearTimeout(timeoutId);
  }
}

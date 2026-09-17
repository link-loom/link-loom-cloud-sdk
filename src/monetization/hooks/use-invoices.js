import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useInvoices — a subject's invoices, a page at a time, plus the actions around them: open one,
 * view it, download its PDF and export the list.
 */
export default function useInvoices({
  service,
  product,
  pageSize = 10,
  locale,
  enabled = true,
} = {}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [busyDocument, setBusyDocument] = useState(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !service) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestRef.current;
    setIsLoading(true);

    const response = await service.getByParameters({
      queryselector: "invoices",
      product,
      page,
      pageSize,
    });

    if (requestId !== requestRef.current) {
      return;
    }

    setItems(response?.success ? response.result?.items || [] : []);
    setTotal(response?.success ? response.result?.totalItems || 0 : 0);
    setError(response?.success ? null : response);
    setIsLoading(false);
  }, [service, product, page, pageSize, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadInvoice = useCallback(
    async (id) => service.getByParameters({ queryselector: "invoice", id }),
    [service],
  );

  const fetchDocument = useCallback(
    async (key, query) => {
      setBusyDocument(key);
      const response = await service.getDocument({ ...query, locale });
      setBusyDocument(null);
      return response;
    },
    [service, locale],
  );

  const view = useCallback(
    (invoice) =>
      fetchDocument(`view:${invoice.id}`, {
        queryselector: "invoice",
        id: invoice.id,
        format: "html",
      }),
    [fetchDocument],
  );

  const download = useCallback(
    (invoice) =>
      fetchDocument(`pdf:${invoice.id}`, {
        queryselector: "invoice",
        id: invoice.id,
        format: "pdf",
      }),
    [fetchDocument],
  );

  const exportCsv = useCallback(
    () => fetchDocument("export", { queryselector: "invoices", product }),
    [fetchDocument, product],
  );

  return {
    items,
    total,
    page,
    pageSize,
    setPage,
    error,
    isLoading,
    refresh,
    loadInvoice,
    view,
    download,
    exportCsv,
    busyDocument,
  };
}

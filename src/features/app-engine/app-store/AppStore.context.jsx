import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@veripass/react-sdk";
import { openSnackbar } from "@link-loom/react-sdk";

import fetchAllPages from "../../../services/utils/fetchAllPages";
import { useAppEngineSDK } from "../context/AppEngineSDK.context";
import { useLaunchpadConfig } from "../launchpad/LaunchpadConfig.context";
import useStoreCatalogs from "./useStoreCatalogs.hook";
import { STORE_ACCESS_STATES, enumName } from "./app-store.enums";
import { STORE_VIEWS, buildStorePaths, resolveStoreLocation } from "./app-store.routes";

/**
 * What every screen of the App Store shares: the catalogs, the navigation counts (`facets`), the
 * suites with the organization's coverage, where each screen lives, and the actions — open an app,
 * get an app or a suite, build one, edit or delete one the organization owns.
 *
 * Getting something does not reload the lists: the store remembers what was just added
 * (`accessOf`) so every card flips to "View" at once, and refreshes the counts and the coverage.
 */
const AppStoreContext = createContext(null);

/**
 * The active organization's name as the Veripass session knows it. The store names the organization
 * from `facets.organization.name`; an organization Veripass cannot look up comes back unnamed there,
 * and the membership recorded in the session still carries its display name.
 */
const sessionOrganizationName = (user) => {
  const organizationId = user?.memberships?.active?.organization_id || user?.payload?.organization_id;
  const membership = (user?.payload?.organizations || []).find((entry) => entry?.organization_id === organizationId);

  return membership?.context?.organization?.profile?.display_name || "";
};

function AppStoreProvider({ onCreateApp, children }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const navigate = useNavigate();
  const location = useLocation();
  const { storeLabels: labels, paths, storageNamespace } = useLaunchpadConfig();
  const { appStoreService, appSuiteService, appDefinitionService } = useAppEngineSDK();
  const { catalogs, isLoading: catalogsLoading, hasError: catalogsFailed, reload: reloadCatalogs } = useStoreCatalogs();
  const { user } = useAuth() || {};

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [facets, setFacets] = useState(null);
  const [suites, setSuites] = useState([]);
  const [accessBySlug, setAccessBySlug] = useState({});
  const [removedIds, setRemovedIds] = useState([]);
  const [acquireTarget, setAcquireTarget] = useState(null);
  const [viewData, setViewData] = useState({ items: [], totalItems: 0, app: null, suite: null });
  const [revision, setRevision] = useState(0);
  // The store's scroll container: the lists watch their scroll sentinel against it.
  const [scrollRoot, setScrollRoot] = useState(null);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [facetsFailed, setFacetsFailed] = useState(false);
  const [suitesLoading, setSuitesLoading] = useState(true);
  const [suitesFailed, setSuitesFailed] = useState(false);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const storePaths = useMemo(() => buildStorePaths(paths.store), [paths.store]);
  const current = useMemo(
    () => resolveStoreLocation(location.pathname, location.search, paths.store),
    [location.pathname, location.search, paths.store],
  );
  const organizationName = facets?.organization?.name || sessionOrganizationName(user) || labels.nav.organizationFallback;
  const mediaBaseUrl = appStoreService?.serviceEndpoints?.baseUrl || "";

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const loadFacets = useCallback(async () => {
    const response = await appStoreService.getFacets();

    if (!response?.success) {
      setFacetsFailed(true);
      return;
    }

    setFacets(response.result);
    setFacetsFailed(false);
  }, [appStoreService]);

  const loadSuites = useCallback(async () => {
    const response = await fetchAllPages((params) => appSuiteService.getAll(params));

    setSuitesLoading(false);

    if (!response?.success) {
      setSuitesFailed(true);
      return;
    }

    setSuites(response.result.items);
    setSuitesFailed(false);
  }, [appSuiteService]);

  const retryAll = useCallback(() => {
    reloadCatalogs();
    loadFacets();
    loadSuites();
    setRevision((value) => value + 1);
  }, [reloadCatalogs, loadFacets, loadSuites]);

  // What the organization has for an app, including what it got a moment ago.
  const accessOf = useCallback((app) => (app && accessBySlug[app.slug] ? { name: accessBySlug[app.slug] } : app?.access), [accessBySlug]);

  const isRemoved = useCallback((app) => removedIds.includes(app?.id), [removedIds]);

  const navigateTo = useCallback(
    (view, params = {}) => {
      const targets = {
        [STORE_VIEWS.discover]: () => storePaths.discover(),
        [STORE_VIEWS.search]: () => storePaths.search(params.query),
        [STORE_VIEWS.suites]: () => storePaths.suites(),
        [STORE_VIEWS.suite]: () => storePaths.suite(params.slug),
        [STORE_VIEWS.app]: () => storePaths.app(params.slug),
        [STORE_VIEWS.category]: () => storePaths.category(enumName(params.category)),
        [STORE_VIEWS.organization]: () => storePaths.organization(),
      };
      const target = targets[view];

      if (!target) {
        return false;
      }

      navigate(target(), params.replace ? { replace: true } : undefined);
      return true;
    },
    [navigate, storePaths],
  );

  const openApp = useCallback((app) => app?.slug && navigate(paths.runtime(app.slug)), [navigate, paths]);

  const editApp = useCallback((app) => app?.id && navigate(paths.studio(app.id)), [navigate, paths]);

  const backToMyApps = useCallback(() => navigate(paths.apps), [navigate, paths]);

  const acquire = useCallback((target) => {
    if (!target?.app && !target?.suite) {
      return;
    }

    setAcquireTarget(target);
  }, []);

  const closeAcquire = useCallback(() => setAcquireTarget(null), []);

  const onAcquired = useCallback(
    ({ slugs }) => {
      setAccessBySlug((currentAccess) => {
        const next = { ...currentAccess };
        (slugs || []).forEach((slug) => {
          next[slug] = STORE_ACCESS_STATES.entitled;
        });
        return next;
      });
      loadFacets();
      loadSuites();
      setRevision((value) => value + 1);
    },
    [loadFacets, loadSuites],
  );

  const deleteApp = useCallback(
    async (app) => {
      const response = await appDefinitionService.delete({ id: app.id });

      if (response?.success === false || !response) {
        openSnackbar(labels.card.deleteFailed, "error");
        return false;
      }

      setRemovedIds((ids) => [...ids, app.id]);
      loadFacets();
      loadSuites();
      return true;
    },
    [appDefinitionService, labels, loadFacets, loadSuites],
  );

  const reportView = useCallback((data) => setViewData((previous) => ({ ...previous, ...data })), []);

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    loadFacets();
    loadSuites();
  }, [loadFacets, loadSuites]);

  // A screen reports what it shows; a new screen starts from nothing so the bridge never reads the
  // previous screen's list.
  useEffect(() => {
    setViewData({ items: [], totalItems: 0, app: null, suite: null });
  }, [current.view, current.app, current.suite, current.category]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const value = useMemo(
    () => ({
      labels,
      paths,
      storePaths,
      storageNamespace,
      current,
      catalogs,
      catalogsLoading,
      facets,
      suites,
      suitesLoading,
      organizationName,
      mediaBaseUrl,
      revision,
      hasError: catalogsFailed || facetsFailed || suitesFailed,
      retryAll,
      accessOf,
      isRemoved,
      navigateTo,
      openApp,
      editApp,
      deleteApp,
      backToMyApps,
      acquire,
      acquireTarget,
      closeAcquire,
      onAcquired,
      createApp: onCreateApp || null,
      viewData,
      reportView,
      scrollRoot,
      setScrollRoot,
    }),
    [
      labels,
      paths,
      storePaths,
      storageNamespace,
      current,
      catalogs,
      catalogsLoading,
      facets,
      suites,
      suitesLoading,
      organizationName,
      mediaBaseUrl,
      revision,
      catalogsFailed,
      facetsFailed,
      suitesFailed,
      retryAll,
      accessOf,
      isRemoved,
      navigateTo,
      openApp,
      editApp,
      deleteApp,
      backToMyApps,
      acquire,
      acquireTarget,
      closeAcquire,
      onAcquired,
      onCreateApp,
      viewData,
      reportView,
      scrollRoot,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

const useAppStore = () => {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }

  return context;
};

export { AppStoreProvider, useAppStore };

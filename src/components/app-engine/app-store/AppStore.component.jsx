import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import { PopUp } from "@link-loom/react-sdk";

import { AppEngineSDKProvider } from "@/features/app-engine/context/AppEngineSDK.context";
import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { AppStoreProvider, useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_QUERY, STORE_SEGMENTS, STORE_VIEWS } from "@/features/app-engine/app-store/app-store.routes";
import StoneOSTabsComponent from "../launchpad/StoneOSTabs.component";
import LaunchpadSearchFieldComponent from "../launchpad/LaunchpadSearchField.component";
import { STORE_COLORS as COLORS } from "../defaults/stoneos-store.palette";
import { STORE_ROOT_SX } from "./app-store.styles";
import AppStoreSidebarComponent from "./subcomponents/AppStoreSidebar.component";
import AppStoreAcquireDialogComponent from "./subcomponents/AppStoreAcquireDialog.component";
import { AppStoreBackLink } from "./subcomponents/AppStoreHeading.component";
import { AppStoreErrorState } from "./subcomponents/AppStoreStatus.component";
import AppStoreDiscoverComponent from "./views/AppStoreDiscover.component";
import AppStoreSearchResultsComponent from "./views/AppStoreSearchResults.component";
import AppStoreAllSuitesComponent from "./views/AppStoreAllSuites.component";
import AppStoreSuiteComponent from "./views/AppStoreSuite.component";
import AppStoreAppDetailComponent from "./views/AppStoreAppDetail.component";
import AppStoreCategoryComponent from "./views/AppStoreCategory.component";
import AppStoreOrganizationComponent from "./views/AppStoreOrganization.component";

const SEARCH_DEBOUNCE_MS = 250;

// The StoneOS tabs bar, in the store's palette.
const TABS_PALETTE = { surface: COLORS.surface, border: COLORS.hairlineSoft, track: COLORS.tabTrack, text: COLORS.ink, textMuted: COLORS.textSecondary };

// Where Back lands when there is nothing to go back to — the screen was opened directly from a link
// or a new tab. Discover and the results have no Back.
const fallbackViewOf = (view) =>
  ({
    [STORE_VIEWS.app]: STORE_VIEWS.discover,
    [STORE_VIEWS.suite]: STORE_VIEWS.suites,
    [STORE_VIEWS.suites]: STORE_VIEWS.discover,
    [STORE_VIEWS.category]: STORE_VIEWS.discover,
    [STORE_VIEWS.organization]: STORE_VIEWS.discover,
  })[view] || null;

// The router numbers each entry of this tab's history; 0 is the page the tab was opened on.
const hasPreviousEntry = () => Number(window.history.state?.idx) > 0;

function DiscoverRoute() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get(STORE_QUERY.search) || "").trim();

  return query ? <AppStoreSearchResultsComponent query={query} /> : <AppStoreDiscoverComponent />;
}

function SuiteRoute() {
  const { slug } = useParams();
  return <AppStoreSuiteComponent slug={slug} />;
}

function AppRoute() {
  const { slug } = useParams();
  return <AppStoreAppDetailComponent slug={slug} />;
}

function CategoryRoute() {
  const { category } = useParams();
  return <AppStoreCategoryComponent category={category} />;
}

function AppStoreShell({ renderBridge, renderCreateApp, contentHeight, activeModal, setActiveModal }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const store = useAppStore();
  const { labels, current, navigateTo, acquire, openApp, acquireTarget, closeAcquire, setScrollRoot, scrollRoot, viewData, facets, catalogs, suites, hasError, retryAll, createApp } = store;

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [term, setTerm] = useState(current.query);
  const searchRef = useRef(null);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const navigate = useNavigate();
  const fallbackView = fallbackViewOf(current.view);

  // Back retraces the person's own steps, wherever they came from; only a screen opened directly
  // falls back to the one above it.
  const goBack = useCallback(() => {
    if (hasPreviousEntry()) {
      navigate(-1);
      return;
    }

    navigateTo(fallbackView);
  }, [navigate, navigateTo, fallbackView]);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const commitSearch = useCallback(
    (value) => {
      const next = value.trim();

      if (next === current.query) {
        return;
      }

      if (next) {
        navigateTo(STORE_VIEWS.search, { query: next, replace: current.view === STORE_VIEWS.search });
        return;
      }

      if (current.view === STORE_VIEWS.search) {
        navigateTo(STORE_VIEWS.discover, { replace: true });
      }
    },
    [current.query, current.view, navigateTo],
  );

  const onSearchKeyDown = (event) => {
    if (event.key === "Escape") setTerm("");
    if (event.key === "Enter") commitSearch(term);
  };

  const onUpdatedEntity = useCallback(
    (action, response) => {
      setActiveModal(null);
      if (action === "create" && response?.success && response?.result?.id) store.editApp(response.result);
    },
    [setActiveModal, store],
  );

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  // The URL is the truth: a search handed over by My apps (`?q=`) fills the field, and leaving the
  // results for another screen empties it.
  useEffect(() => {
    setTerm((value) => (value.trim() === current.query ? value : current.query));
  }, [current.query]);

  useEffect(() => {
    if (term.trim() === current.query) return undefined;
    const timer = setTimeout(() => commitSearch(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, current.query, commitSearch]);

  // A new screen starts at its top.
  useEffect(() => {
    if (scrollRoot) scrollRoot.scrollTop = 0;
  }, [current.view, current.app, current.suite, current.category, scrollRoot]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      {renderBridge?.({
        view: current.view,
        query: current.query,
        category: current.category || null,
        suite: viewData.suite || (current.suite ? { slug: current.suite } : null),
        app: viewData.app || (current.app ? { slug: current.app } : null),
        apps: viewData.items,
        totalItems: viewData.totalItems,
        organization: facets?.organization || null,
        suites,
        catalogs,
        views: STORE_VIEWS,
        setQuery: setTerm,
        navigateTo,
        acquire,
        open: openApp,
        createApp,
        activeModal,
        setActiveModal,
      })}

      {/* The store's root: its palette as scoped custom properties, so no host colour reaches it.
          `display: contents` keeps the tabs bar and the store exactly where the host lays them out. */}
      <Box data-loom-app-store="" sx={{ ...STORE_ROOT_SX, display: "contents" }}>
        {/* The store is the other half of StoneOS, so it carries the same tabs; its way back to the
            screen above lives in the bar's left cell. */}
        <StoneOSTabsComponent
          value="store"
          palette={TABS_PALETTE}
          leading={
            fallbackView ? <AppStoreBackLink label={labels.nav.back} onClick={goBack} /> : null
          }
        />

        <Box component="section" className="d-flex" sx={{ height: contentHeight, minHeight: 0, backgroundColor: COLORS.canvas }}>
          <AppStoreSidebarComponent />

          <Box ref={setScrollRoot} className="flex-grow-1" sx={{ minWidth: 0, overflowY: "auto", position: "relative", backgroundColor: COLORS.canvas }}>
            <Box
              className="d-flex justify-content-center"
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                px: { xs: 2, md: 5 },
                py: 1.75,
                backgroundColor: `color-mix(in srgb, ${COLORS.canvas} 92%, transparent)`,
                backdropFilter: "blur(10px)",
                borderBottom: `1px solid ${COLORS.hairlineSoft}`,
              }}
            >
              <LaunchpadSearchFieldComponent
                inputRef={searchRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={labels.searchPlaceholder}
                shortcut={labels.searchShortcut}
              />
            </Box>

            <Box sx={{ p: { xs: "24px 16px 48px", md: "28px 40px 56px" }, boxSizing: "border-box" }}>
              {hasError && !catalogs.categories.length && <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={retryAll} />}
              <Routes>
                <Route index element={<DiscoverRoute />} />
                <Route path={STORE_SEGMENTS.suites} element={<AppStoreAllSuitesComponent />} />
                <Route path={`${STORE_SEGMENTS.suites}/:slug`} element={<SuiteRoute />} />
                <Route path={`${STORE_SEGMENTS.apps}/:slug`} element={<AppRoute />} />
                <Route path={`${STORE_SEGMENTS.categories}/:category`} element={<CategoryRoute />} />
                <Route path={STORE_SEGMENTS.organization} element={<AppStoreOrganizationComponent />} />
                <Route path="*" element={<Navigate to={store.storePaths.discover()} replace />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Box>

      {acquireTarget && <AppStoreAcquireDialogComponent key={acquireTarget.app?.slug || acquireTarget.suite?.slug} target={acquireTarget} onClose={closeAcquire} />}

      <PopUp
        data-testid="popup-modal"
        id="popup-modal"
        isOpen={Boolean(activeModal)}
        setIsOpen={(isOpen) => setActiveModal(isOpen ? activeModal : null)}
        className="col-lg-4 col-md-8 col-12"
        styles={{ closeButtonColor: "text-black-50" }}
      >
        {activeModal === "create" && renderCreateApp?.({ onUpdatedEntity, onClose: () => setActiveModal(null) })}
      </PopUp>
    </>
  );
}

function AppStoreInner({ renderBridge, renderCreateApp, contentHeight }) {
  const [activeModal, setActiveModal] = useState(null);
  // "Build your own app" exists only when the host provides the form that creates one.
  const openCreate = useCallback(() => setActiveModal("create"), []);

  return (
    <AppStoreProvider onCreateApp={renderCreateApp ? openCreate : null}>
      <AppStoreShell
        renderBridge={renderBridge}
        renderCreateApp={renderCreateApp}
        contentHeight={contentHeight}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />
    </AppStoreProvider>
  );
}

/**
 * The App Store. The host mounts it on a splat route (`store/*`) at `paths.store`; every screen is a
 * route under it — Discover (`?q=` for the search), `suites`, `suites/:slug`, `apps/:slug`,
 * `categories/:category` and `organization` — so links are shareable and the back button works.
 *
 * - `renderCreateApp({ onUpdatedEntity, onClose })` renders the host's create form in the store's
 *   modal ("Build your own app"); without it there is no build entry. `onUpdatedEntity("create",
 *   response)` opens the new app in the Studio.
 * - `renderBridge(state)` mounts the host's context bridge (e.g. the Sommatic Command Center) with
 *   `{ view, query, category, suite, app, apps, totalItems, organization, suites, catalogs, views,
 *   setQuery, navigateTo, acquire, open, createApp, activeModal, setActiveModal }`; it should render
 *   nothing visible. `acquire({ app } | { suite })` opens the confirmation dialog — the person still
 *   confirms — and `navigateTo(view, { slug, category, query })` moves between the store's screens.
 * - `contentHeight` is the height of the store below the tabs; the default fits a 70px top bar, the
 *   52px tabs bar and a 50px footer.
 */
function AppStoreComponent({ baseUrl, renderBridge, renderCreateApp, contentHeight = "calc(100vh - 172px)" }) {
  const config = useLaunchpadConfig();

  return (
    <AppEngineSDKProvider baseUrl={baseUrl || config.baseUrl}>
      <AppStoreInner renderBridge={renderBridge} renderCreateApp={renderCreateApp} contentHeight={contentHeight} />
    </AppEngineSDKProvider>
  );
}

export default AppStoreComponent;

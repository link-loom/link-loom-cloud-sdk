import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@veripass/react-sdk";
import { PopUp } from "@link-loom/react-sdk";

import { AppEngineSDKProvider, useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { getCategoryIcon } from "../categoryIcon.util";
import StoneOSTabsComponent from "../launchpad/StoneOSTabs.component";
import AppStoreHeaderBarComponent from "./subcomponents/AppStoreHeaderBar.component";
import AppStoreSidebarComponent from "./subcomponents/AppStoreSidebar.component";
import AppStoreGridComponent from "./subcomponents/AppStoreGrid.component";
import AppStoreFeaturedComponent from "./subcomponents/AppStoreFeatured.component";
import AppStoreDetailsComponent from "./subcomponents/AppStoreDetails.component";

function getCategoryTitle(category, labels) {
  if (!category) return labels.discover;
  if (category === "pinned") return labels.pinnedTitle;
  if (category === "favorites") return labels.favorites;
  if (category === "official") return labels.officialTitle;
  return labels.categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategorySubtitle(category, labels) {
  if (!category) return labels.discoverSubtitle;
  if (category === "pinned") return labels.pinnedSubtitle;
  if (category === "favorites") return labels.favoritesSubtitle;
  if (category === "official") return labels.officialSubtitle;
  return labels.categorySubtitles[category] || labels.categoryFallbackSubtitle;
}

function AppStoreInner({ renderBridge, renderCreateApp, contentHeight }) {
  const navigate = useNavigate();
  const { storeLabels: labels, paths } = useLaunchpadConfig();
  // The launchpad hands a search over when it has nothing local to show
  // ("Search the App Store for …"), so the person lands with it already typed.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const handed = searchParams.get("q");
    if (handed) setSearchTerm(handed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { user } = useAuth();
  const { appDefinitionService, appPreferenceService } = useAppEngineSDK();

  const organizationId = user?.payload?.organization_id;
  const userIdentity = user?.identity;

  const [apps, setApps] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [focusZone, setFocusZone] = useState("grid"); // "grid" | "sidebar"
  const [sidebarFocusedIndex, setSidebarFocusedIndex] = useState(0);

  const searchInputRef = useRef(null);
  const visibleItemsRef = useRef([]);
  const focusedIndexRef = useRef(0);
  const gridContainerRef = useRef(null);

  // Data fetching
  const initializeComponent = async () => {
    try {
      const [defsResponse, prefsResponse] = await Promise.allSettled([
        appDefinitionService.getMarketplace({ organization_id: organizationId, pageSize: 200 }),
        userIdentity ? appPreferenceService.getByParameters({ queryselector: "user", search: userIdentity }) : Promise.resolve(null),
      ]);

      setLoading(false);

      const appItems = defsResponse.status === "fulfilled" && defsResponse.value?.success ? defsResponse.value.result.items || [] : [];

      // Build preference map and merge into apps
      const prefsMap = {};
      if (prefsResponse.status === "fulfilled" && prefsResponse.value?.result?.items) {
        for (const pref of prefsResponse.value.result.items) {
          prefsMap[pref.app_definition_id] = pref;
        }
      }
      setPreferences(prefsMap);

      const enrichedApps = appItems.map((app) => {
        const pref = prefsMap[app.id];
        return {
          ...app,
          is_pinned: pref?.is_pinned || false,
          is_favorite: pref?.is_favorite || false,
        };
      });

      setApps(enrichedApps);
    } catch (error) {
      console.error("Failed to load app definitions:", error);
      setLoading(false);
      setApps([]);
    }
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  // Filtering
  const filteredItems = useMemo(() => {
    let result = apps;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((app) => {
        if (app.name?.toLowerCase().includes(term)) return true;
        if (app.slug?.toLowerCase().includes(term)) return true;
        if (app.tags?.some((t) => {
          const tagText = typeof t === "string" ? t : t?.name || t?.title || "";
          return tagText.toLowerCase().includes(term);
        })) return true;
        const firstLine = app.description?.split("\n").find((line) => line.trim() !== "")?.trim() || "";
        return firstLine.toLowerCase().includes(term);
      });
      return result;
    }

    if (selectedPublisher) {
      result = result.filter((app) => {
        const pubName = app.publisher?.name || app.publisher?.profile?.name;
        return pubName === selectedPublisher;
      });
    }

    if (selectedCategory === "pinned") {
      result = result.filter((app) => app.is_pinned);
    } else if (selectedCategory === "favorites") {
      result = result.filter((app) => app.is_favorite);
    } else if (selectedCategory === "official") {
      result = result.filter((app) => app.is_official);
    } else if (selectedCategory) {
      result = result.filter((app) => {
        const rawCat = app.category || app.manifest?.kind;
        const cat = typeof rawCat === "string" ? rawCat : rawCat?.name || rawCat?.title || "";
        return cat === selectedCategory;
      });
    }

    return result;
  }, [apps, selectedCategory, selectedPublisher, searchTerm]);

  // Unified visible items list — matches what the user sees on screen top-to-bottom
  const showSections = !selectedCategory && !searchTerm && !selectedPublisher;

  const { visibleItems, featuredSlice, orgSlice, allAppsSlice } = useMemo(() => {
    if (!showSections) {
      return {
        visibleItems: filteredItems,
        featuredSlice: null,
        orgSlice: null,
        allAppsSlice: { start: 0, end: filteredItems.length },
      };
    }

    const featured = apps.filter((app) => app.is_featured === true).slice(0, 4);
    const featuredIds = new Set(featured.map((a) => a.id));

    const org = filteredItems.filter((app) => app.organization_id === organizationId && !app.is_official && !featuredIds.has(app.id));
    const orgIds = new Set(org.map((a) => a.id));

    const allRest = filteredItems.filter((app) => !featuredIds.has(app.id) && !orgIds.has(app.id));
    const unified = [...featured, ...org, ...allRest];

    return {
      visibleItems: unified,
      featuredSlice: featured.length > 0 ? { start: 0, end: featured.length } : null,
      orgSlice: org.length > 0 ? { start: featured.length, end: featured.length + org.length } : null,
      allAppsSlice: { start: featured.length + org.length, end: unified.length },
    };
  }, [apps, filteredItems, showSections, organizationId]);

  // Build sidebar navigable items list (mirrors visual order)
  const sidebarItems = useMemo(() => {
    const items = [{ type: "category", key: null, label: labels.allApps }];
    const pinnedCount = apps.filter((a) => a.is_pinned).length;
    const favoritesCount = apps.filter((a) => a.is_favorite).length;
    const officialCount = apps.filter((a) => a.is_official).length;
    if (pinnedCount > 0) items.push({ type: "category", key: "pinned", label: labels.pinned });
    if (favoritesCount > 0) items.push({ type: "category", key: "favorites", label: labels.favorites });
    if (officialCount > 0) items.push({ type: "category", key: "official", label: labels.official });

    const catMap = new Map();
    for (const app of apps) {
      const rawCat = app.category || app.manifest?.kind || "uncategorized";
      const cat = typeof rawCat === "string" ? rawCat : rawCat?.name || rawCat?.title || "uncategorized";
      if (!catMap.has(cat)) catMap.set(cat, true);
    }
    const CATEGORY_ORDER = { workspace: 0, utility: 1, hitl: 2, ai: 3, analytics: 4, integration: 5, forms: 6, form: 6, data: 7 };
    const sortedCats = Array.from(catMap.keys()).sort((a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99));
    for (const cat of sortedCats) {
      items.push({ type: "category", key: cat, label: cat });
    }
    return items;
  }, [apps, labels]);

  // Keep refs in sync for keyboard handler
  visibleItemsRef.current = visibleItems;
  focusedIndexRef.current = focusedIndex;

  // Dynamic columns per row — matches CSS grid: repeat(auto-fill, minmax(220px, 1fr))
  const getColumnsPerRow = useCallback(() => {
    const container = gridContainerRef.current;
    if (!container) return 4;
    const width = container.offsetWidth;
    return Math.max(1, Math.floor((width + 16) / (220 + 16)));
  }, []);

  // Auto-select first item when visible list changes
  useEffect(() => {
    if (visibleItems.length > 0) {
      setSelectedApp(visibleItems[0]);
      setFocusedIndex(0);
      setFocusZone("grid");
    } else {
      setSelectedApp(null);
      setFocusedIndex(-1);
    }
  }, [visibleItems]);

  // Handlers
  const handleOpenApp = useCallback(
    (app) => {
      navigate(paths.runtime(app.slug));
    },
    [navigate, paths]
  );

  const handleEditApp = useCallback(
    (app) => {
      navigate(paths.studio(app.id));
    },
    [navigate, paths]
  );

  // "New App" exists only when the host provides the form that creates one.
  const handleCreateApp = useMemo(() => (renderCreateApp ? () => setActiveModal("create") : null), [renderCreateApp]);

  const onUpdatedEntity = useCallback(
    (action, response) => {
      if (action === "create" && response?.success && response?.result?.id) {
        navigate(paths.studio(response.result.id));
      }
      setActiveModal(null);
    },
    [navigate, paths]
  );

  const handleDeleteApp = useCallback(
    async (app) => {
      try {
        await appDefinitionService.delete({ id: app.id });
        setApps((prev) => prev.filter((a) => a.id !== app.id));
        if (selectedApp?.id === app.id) {
          setSelectedApp(null);
          setShowDetailsPanel(false);
        }
      } catch (error) {
        console.error("Failed to delete app:", error);
      }
    },
    [appDefinitionService, selectedApp]
  );

  const handlePinApp = useCallback(async (app) => {
    const newPinned = !app.is_pinned;
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, is_pinned: newPinned } : a)));

    try {
      const existingPref = preferences[app.id];
      if (existingPref?.id) {
        await appPreferenceService.update({ id: existingPref.id, is_pinned: newPinned });
        setPreferences((prev) => ({ ...prev, [app.id]: { ...existingPref, is_pinned: newPinned } }));
      } else {
        const response = await appPreferenceService.create({
          user_id: userIdentity,
          app_definition_id: app.id,
          organization_id: organizationId,
          is_pinned: newPinned,
          is_favorite: app.is_favorite || false,
        });
        if (response?.success && response?.result) {
          setPreferences((prev) => ({ ...prev, [app.id]: response.result }));
        }
      }
    } catch (error) {
      console.error("Failed to persist pin:", error);
    }
  }, [preferences, appPreferenceService, userIdentity, organizationId]);

  const handleFavoriteApp = useCallback(async (app) => {
    const newFavorite = !app.is_favorite;
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, is_favorite: newFavorite } : a)));

    try {
      const existingPref = preferences[app.id];
      if (existingPref?.id) {
        await appPreferenceService.update({ id: existingPref.id, is_favorite: newFavorite });
        setPreferences((prev) => ({ ...prev, [app.id]: { ...existingPref, is_favorite: newFavorite } }));
      } else {
        const response = await appPreferenceService.create({
          user_id: userIdentity,
          app_definition_id: app.id,
          organization_id: organizationId,
          is_pinned: app.is_pinned || false,
          is_favorite: newFavorite,
        });
        if (response?.success && response?.result) {
          setPreferences((prev) => ({ ...prev, [app.id]: response.result }));
        }
      }
    } catch (error) {
      console.error("Failed to persist favorite:", error);
    }
  }, [preferences, appPreferenceService, userIdentity, organizationId]);

  const handleSelect = useCallback((app) => {
    setSelectedApp(app);
    setShowDetailsPanel(true);
    const idx = visibleItemsRef.current.findIndex((a) => a.id === app?.id);
    if (idx >= 0) setFocusedIndex(idx);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowDetailsPanel(false);
  }, []);

  const handleRequestPremium = useCallback((slug, requestType) => {
    // TODO: Integrate with premium/subscription service
    console.warn(`Premium request: ${requestType} for ${slug}`);
  }, []);

  // Search change handler
  const handleSearchChange = useCallback((val) => {
    setSearchTerm(val);
    if (val) {
      setSelectedCategory(null);
      setSelectedPublisher(null);
    }
    setFocusedIndex(-1);
  }, []);

  // Scroll the focused card into view
  const scrollToFocusedApp = useCallback((appId) => {
    if (!appId) return;
    requestAnimationFrame(() => {
      const card = gridContainerRef.current?.querySelector(`[data-app-id="${appId}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  // Keyboard navigation — two zones: sidebar + grid
  useEffect(() => {
    const isInputFocused = () => document.activeElement?.tagName === "INPUT";

    const navigateGrid = (nextIndex) => {
      const items = visibleItemsRef.current;
      const clamped = Math.max(0, Math.min(nextIndex, items.length - 1));
      if (items[clamped]) {
        setSelectedApp(items[clamped]);
        scrollToFocusedApp(items[clamped].id);
      }
      return clamped;
    };

    const handleKeyDown = (e) => {
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // === ESCAPE CASCADE ===
      if (e.key === "Escape") {
        if (showDetailsPanel) {
          setShowDetailsPanel(false);
        } else if (focusZone === "grid") {
          setFocusZone("sidebar");
          // Set sidebar focus to match current category
          const currentKey = selectedCategory;
          const idx = sidebarItems.findIndex((item) => item.key === currentKey);
          setSidebarFocusedIndex(idx >= 0 ? idx : 0);
        } else if (searchTerm) {
          setSearchTerm("");
        } else if (selectedCategory || selectedPublisher) {
          setSelectedCategory(null);
          setSelectedPublisher(null);
          setSidebarFocusedIndex(0);
        }
        return;
      }

      // === SIDEBAR ZONE ===
      if (focusZone === "sidebar") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSidebarFocusedIndex((prev) => Math.min(prev + 1, sidebarItems.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSidebarFocusedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const item = sidebarItems[sidebarFocusedIndex];
          if (item) {
            setSelectedCategory(item.key);
            setSelectedPublisher(null);
          }
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setFocusZone("grid");
          setFocusedIndex(0);
          const items = visibleItemsRef.current;
          if (items[0]) setSelectedApp(items[0]);
          return;
        }
        return;
      }

      // === GRID ZONE ===
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isInputFocused()) return;
        setFocusedIndex((prev) => navigateGrid(prev + 1));
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isInputFocused()) return;
        setFocusedIndex((prev) => {
          if (prev <= 0 || prev % getColumnsPerRow() === 0) {
            // At leftmost column — move to sidebar
            setFocusZone("sidebar");
            const currentKey = selectedCategory;
            const idx = sidebarItems.findIndex((item) => item.key === currentKey);
            setSidebarFocusedIndex(idx >= 0 ? idx : 0);
            return prev;
          }
          return navigateGrid(prev - 1);
        });
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isInputFocused()) document.activeElement.blur();
        const cols = getColumnsPerRow();
        setFocusedIndex((prev) => navigateGrid(prev + cols));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isInputFocused()) document.activeElement.blur();
        const cols = getColumnsPerRow();
        setFocusedIndex((prev) => navigateGrid(prev - cols));
        return;
      }

      if (e.key === "Enter" && !isInputFocused()) {
        const currentIndex = focusedIndexRef.current;
        const currentItems = visibleItemsRef.current;
        if (currentIndex >= 0 && currentIndex < currentItems.length) {
          if (e.ctrlKey || e.metaKey) {
            handleOpenApp(currentItems[currentIndex]);
          } else {
            setSelectedApp(currentItems[currentIndex]);
            setShowDetailsPanel((prev) => !prev);
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDetailsPanel, searchTerm, selectedCategory, selectedPublisher, focusZone, sidebarFocusedIndex, sidebarItems, handleOpenApp, getColumnsPerRow, scrollToFocusedApp]);

  const gridFocusedIndex = focusZone === "grid" ? focusedIndex : -1;
  const gridSelectedAppId = focusZone === "grid" ? selectedApp?.id : null;

  return (
    <>
      {renderBridge?.({
        apps,
        selectedApp,
        loading,
        preferences,
        searchTerm,
        selectedCategory,
        selectedPublisher,
        activeModal,
        setActiveModal,
        handleSearchChange,
        handleOpenApp,
        handleEditApp,
        handleCreateApp,
        handleSelect,
        handleDeleteApp,
        handlePinApp,
        handleFavoriteApp,
      })}
      {/* The store is the other half of StoneOS, so it carries the same way
          back — in its own row, above the catalog's own header. */}
      <StoneOSTabsComponent value="store" />
      <section className="d-flex flex-column" style={{ height: contentHeight }}>
        <AppStoreHeaderBarComponent
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchInputRef={searchInputRef}
          onCreateApp={handleCreateApp}
        />

        <div className="d-flex flex-grow-1 overflow-hidden position-relative">
          <AppStoreSidebarComponent
            apps={apps}
            collapsed={showDetailsPanel}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setFocusedIndex(-1);
              setFocusZone("grid");
            }}
            selectedPublisher={selectedPublisher}
            onSelectPublisher={(pub) => {
              setSelectedPublisher(pub);
              setFocusedIndex(-1);
              setFocusZone("grid");
            }}
            sidebarItems={sidebarItems}
            sidebarFocusedIndex={focusZone === "sidebar" ? sidebarFocusedIndex : -1}
          />

          <div ref={gridContainerRef} className="d-flex flex-column flex-grow-1 overflow-auto" style={{ minWidth: 0 }}>
            {/* Category title + subtitle */}
            <div className="px-4 pt-3">
              <h5 className="mb-1">{getCategoryTitle(selectedCategory, labels)}</h5>
              <p className="text-muted mb-0 small">{getCategorySubtitle(selectedCategory, labels)}</p>
            </div>

            {/* Featured tiles */}
            {showSections && featuredSlice && (
              <AppStoreFeaturedComponent
                apps={visibleItems.slice(featuredSlice.start, featuredSlice.end)}
                onSelect={handleSelect}
                onOpenApp={handleOpenApp}
                selectedAppId={gridSelectedAppId}
                focusedIndex={gridFocusedIndex}
                indexOffset={featuredSlice.start}
                getCategoryIcon={getCategoryIcon}
              />
            )}

            {/* Organization Apps */}
            {showSections && orgSlice && (
              <AppStoreGridComponent
                apps={visibleItems.slice(orgSlice.start, orgSlice.end)}
                selectedAppId={gridSelectedAppId}
                focusedIndex={gridFocusedIndex}
                indexOffset={orgSlice.start}
                onSelect={handleSelect}
                onOpenApp={handleOpenApp}
                onEditApp={handleEditApp}
                onPinApp={handlePinApp}
                onFavoriteApp={handleFavoriteApp}
                onDeleteApp={handleDeleteApp}
                searchTerm=""
                loading={false}
                selectedCategory={null}
                onClearFilters={() => {}}
                onCreateApp={handleCreateApp}
                getCategoryIcon={getCategoryIcon}
                sectionLabel={labels.organizationApps}
                userOrganizationId={organizationId}
              />
            )}

            {/* All Apps Grid */}
            <AppStoreGridComponent
              apps={showSections ? visibleItems.slice(allAppsSlice.start, allAppsSlice.end) : visibleItems}
              selectedAppId={gridSelectedAppId}
              focusedIndex={gridFocusedIndex}
              indexOffset={allAppsSlice.start}
              onSelect={handleSelect}
              onOpenApp={handleOpenApp}
              onEditApp={handleEditApp}
              onPinApp={handlePinApp}
              onFavoriteApp={handleFavoriteApp}
              onDeleteApp={handleDeleteApp}
              searchTerm={searchTerm}
              loading={loading}
              selectedCategory={selectedCategory}
              onClearFilters={() => {
                setSearchTerm("");
                setSelectedCategory(null);
                setSelectedPublisher(null);
              }}
              onCreateApp={handleCreateApp}
              getCategoryIcon={getCategoryIcon}
              sectionLabel={showSections ? labels.allApps : null}
              userOrganizationId={organizationId}
            />
          </div>

          {/* Details panel */}
          {showDetailsPanel && (
            <AppStoreDetailsComponent
              app={selectedApp}
              onOpenApp={handleOpenApp}
              onEditApp={handleEditApp}
              onPinApp={handlePinApp}
              onFavoriteApp={handleFavoriteApp}
              onClose={handleCloseDetails}
              onRequestPremium={handleRequestPremium}
              getCategoryIcon={getCategoryIcon}
              userOrganizationId={organizationId}
            />
          )}
        </div>
      </section>

      <PopUp
        data-testid="popup-modal"
        id="popup-modal"
        isOpen={Boolean(activeModal)}
        setIsOpen={(isOpen) => setActiveModal(isOpen ? Boolean(activeModal) : null)}
        className="col-lg-4 col-md-8 col-12"
        styles={{
          closeButtonColor: "text-black-50",
        }}
      >
        {activeModal === "create" && renderCreateApp?.({ onUpdatedEntity, onClose: () => setActiveModal(null) })}
      </PopUp>
    </>
  );
}

/**
 * The App Store: the organization's catalog with categories, publishers, search (`/` focuses it),
 * featured apps, a details panel, pin/favorite and, for apps the organization owns, edit/delete.
 *
 * - `renderCreateApp({ onUpdatedEntity, onClose })` renders the host's create form inside the store's
 *   modal; without it there is no "New App" button. `onUpdatedEntity("create", response)` opens the new
 *   app in the studio.
 * - `renderBridge(state)` mounts the host's context bridge (e.g. the Sommatic Command Center); it
 *   should render nothing visible.
 * - `contentHeight` is the height of the catalog below the tabs; the default fits a 70px top bar, the
 *   52px tabs bar and a 50px footer.
 */
function AppStoreComponent({ baseUrl, renderBridge, renderCreateApp, contentHeight = "calc(100vh - 172px)" }) {
  return (
    <AppEngineSDKProvider baseUrl={baseUrl}>
      <AppStoreInner renderBridge={renderBridge} renderCreateApp={renderCreateApp} contentHeight={contentHeight} />
    </AppEngineSDKProvider>
  );
}

export default AppStoreComponent;

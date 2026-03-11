import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { fetchMultipleEntities } from "../../../services/utils/entityServiceAdapter";
import AppMarketplaceCard from "./AppMarketplaceCard.component";
import {
  MARKETPLACE_UI_DEFAULTS,
  mergeDefaults,
} from "../defaults/appEngine.defaults";
import { useAppEngineSDK } from "../../../features/app-engine/context/AppEngineSDK.context";

const StyledTabs = styled(Tabs)({
  minHeight: "36px",
  "& .MuiTab-root": {
    minHeight: "36px",
    textTransform: "none",
    fontSize: "13px",
  },
  "& .MuiTabs-indicator": {
    height: "2px",
  },
});

const StyledTab = styled(Tab)({
  minHeight: "36px",
});

const AppMarketplaceGrid = ({
  ui,
  onOpenApp,
  onEditApp,
  onCreateApp,
  onDeleteApp,
  onPinApp,
  onFavoriteApp,
  onPreferencesLoaded,
  organizationId,
  user,
  className = "",
  renderCard,
  renderEmptyState,
}) => {
  const config = mergeDefaults(MARKETPLACE_UI_DEFAULTS, ui);

  // Models
  const { appDefinitionService, appPreferenceService } = useAppEngineSDK();
  const [apps, setApps] = useState([]);
  const [preferences, setPreferences] = useState({});

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const initializeComponent = async () => {
    if (!appDefinitionService) return;

    const [definitionsResponse, preferencesResponse] =
      await fetchMultipleEntities([
        {
          service: appDefinitionService,
          payload: {
            queryselector: organizationId ? "organization-id" : "all",
            exclude_status: "deleted",
            query: {
              search: organizationId || "",
            },
          },
        },
        {
          service: appPreferenceService,
          payload: {
            queryselector: "user",
            exclude_status: "deleted",
            query: {
              search: user?.identity || "",
            },
          },
        },
      ]);

    setLoading(false);

    if (definitionsResponse?.result?.items) {
      setApps(definitionsResponse.result.items);
    }

    if (preferencesResponse?.result?.items) {
      const prefsMap = {};
      for (const pref of preferencesResponse.result.items) {
        prefsMap[pref.app_definition_id] = pref;
      }
      setPreferences(prefsMap);

      if (onPreferencesLoaded) {
        onPreferencesLoaded(prefsMap);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    initializeComponent();
  }, [user]);

  const filteredApps = apps.filter((app) => {
    const appKind = app.manifest?.kind || "workspace";
    const launcherVisibility = app.manifest?.launcher_visibility || "visible";

    if (kindFilter === "workspace" && appKind !== "workspace") return false;
    if (kindFilter === "utility" && appKind !== "utility") return false;
    if (kindFilter === "all" && launcherVisibility === "system") return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      app.name?.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query) ||
      app.category?.toLowerCase().includes(query) ||
      app.slug?.toLowerCase().includes(query)
    );
  });

  const handleCreateApp = async () => {
    if (!onCreateApp) return;

    await onCreateApp();
    initializeComponent();
  };

  const handleDeleteApp = async (app) => {
    if (!onDeleteApp) return;

    await onDeleteApp(app);
    initializeComponent();
  };

  const handlePinApp = async (app, isPinned) => {
    try {
      if (!appPreferenceService || !user.identity) {
        return;
      }
      const existing = preferences[app.id];
      let response;

      if (existing?.id) {
        response = await appPreferenceService.update({
          id: existing.id,
          is_pinned: isPinned,
        });
      } else {
        response = await appPreferenceService.create({
          user_id: user.identity,
          organization_id: organizationId,
          app_definition_id: app.id,
          is_pinned: isPinned,
        });
      }

      if (response?.result) {
        setPreferences((prev) => ({
          ...prev,
          [app.id]: response.result,
        }));
      }
    } catch (error) {
      console.error("Failed to pin app:", error);
    }

    if (onPinApp) onPinApp(app, isPinned);
    // initializeComponent(); // Removed to avoid full re-fetch since we update state locally
  };

  const handleFavoriteApp = async (app, isFavorite) => {
    if (!appPreferenceService || !user.identity) return;

    try {
      const existing = preferences[app.id];
      let response;

      if (existing?.id) {
        response = await appPreferenceService.update({
          id: existing.id,
          is_favorite: isFavorite,
        });
      } else {
        response = await appPreferenceService.create({
          user_id: user.identity,
          organization_id: organizationId,
          app_definition_id: app.id,
          is_favorite: isFavorite,
        });
      }

      if (response?.result) {
        setPreferences((prev) => ({
          ...prev,
          [app.id]: response.result,
        }));
      }
    } catch (error) {
      console.error("Failed to favorite app:", error);
    }

    if (onFavoriteApp) onFavoriteApp(app, isFavorite);
    // initializeComponent(); // Removed to avoid full re-fetch since we update state locally
  };

  const renderEmptyContent = () => {
    if (renderEmptyState) {
      return renderEmptyState({ searchQuery });
    }

    return (
      <div className="text-center py-5">
        <p className="text-muted mb-1">
          {searchQuery ? config.noAppsSearch : config.noAppsYet}
        </p>
        <p className="text-muted small">
          {searchQuery ? config.noAppsSearchHint : config.noAppsHint}
        </p>
        {!searchQuery && onCreateApp && (
          <button
            className="btn btn-outline-dark btn-sm mt-2"
            onClick={(event) => {
              event.preventDefault();
              handleCreateApp();
            }}
          >
            <AddIcon className="me-1" fontSize="small" />{" "}
            {config.createAppLabel}
          </button>
        )}
      </div>
    );
  };

  const canPin = Boolean(appPreferenceService && user.identity);

  const renderAppCard = (app) => {
    if (renderCard) {
      return renderCard({
        app,
        preference: preferences[app.id],
        onOpen: onOpenApp,
        onEdit: onEditApp,
        onDelete: handleDeleteApp,
        onPin: canPin ? handlePinApp : undefined,
        onFavorite: canPin ? handleFavoriteApp : undefined,
      });
    }

    return (
      <AppMarketplaceCard
        app={app}
        ui={config}
        preference={preferences[app.id]}
        onOpen={onOpenApp}
        onEdit={onEditApp}
        onDelete={handleDeleteApp}
        onPin={canPin ? handlePinApp : undefined}
        onFavorite={canPin ? handleFavoriteApp : undefined}
      />
    );
  };

  const content = (
    <>
      <header className="d-flex flex-row justify-content-between align-items-start">
        <section>
          <h4 className="mt-0 header-title">{config.title}</h4>
          <p className="text-muted font-14 mb-3">{config.subtitle}</p>
        </section>
        {onCreateApp && (
          <section className="align-items-sm-baseline d-flex">
            <button
              className="btn btn-dark"
              onClick={(event) => {
                event.preventDefault();
                handleCreateApp();
              }}
            >
              <AddIcon className="me-1" fontSize="small" /> {config.newAppLabel}
            </button>
          </section>
        )}
      </header>

      <section className="content">
        <section className="filters mb-3">
          <StyledTabs
            value={kindFilter}
            onChange={(e, value) => setKindFilter(value)}
            className="mb-3"
          >
            <StyledTab label={config.tabAll} value="all" />
            <StyledTab label={config.tabWorkspaces} value="workspace" />
            <StyledTab label={config.tabUtilities} value="utility" />
          </StyledTabs>

          <TextField
            placeholder={config.searchPlaceholder}
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" className="text-muted" />
                </InputAdornment>
              ),
            }}
            sx={{ width: "320px" }}
          />
        </section>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <CircularProgress size={32} />
          </div>
        ) : filteredApps.length === 0 ? (
          renderEmptyContent()
        ) : (
          <div className="row g-3">
            {filteredApps.map((app) => (
              <div className={config.gridColumnClass} key={app.id}>
                {renderAppCard(app)}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  if (config.containerless) {
    return <div className={className || undefined}>{content}</div>;
  }

  return (
    <article className={`card shadow ${className}`.trim()}>
      <section className="card-body">{content}</section>
    </article>
  );
};

export default AppMarketplaceGrid;

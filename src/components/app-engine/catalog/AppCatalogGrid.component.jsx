import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { fetchMultipleEntities } from '../../../services/utils/entityServiceAdapter';
import AppCatalogCard from './AppCatalogCard.component';

const StyledTabs = styled(Tabs)({
  minHeight: '36px',
  '& .MuiTab-root': {
    minHeight: '36px',
    textTransform: 'none',
    fontSize: '13px',
  },
  '& .MuiTabs-indicator': {
    height: '2px',
  },
});

const StyledTab = styled(Tab)({
  minHeight: '36px',
});

const AppCatalogGrid = ({
  appDefinitionService,
  appPreferenceService,
  onOpenApp,
  onEditApp,
  onCreateApp,
  onDeleteApp,
  onPinApp,
  onFavoriteApp,
  onPreferencesLoaded,
  organizationId,
}) => {
  // Models
  const [apps, setApps] = useState([]);
  const [preferences, setPreferences] = useState({});

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const initializeComponent = async () => {
    if (!appDefinitionService) return;

    const [definitionsResponse, preferencesResponse] = await fetchMultipleEntities([
      {
        service: appDefinitionService,
        payload: {
          queryselector: organizationId ? 'organization-id' : 'all',
          exclude_status: 'deleted',
          query: { search: organizationId || '' },
        },
      },
      {
        service: appPreferenceService,
        payload: {
          queryselector: 'all',
          exclude_status: 'deleted',
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
    setLoading(true);
    initializeComponent();
  }, []);

  const filteredApps = apps.filter((app) => {
    const appKind = app.manifest?.kind || 'workspace';
    const launcherVisibility = app.manifest?.launcher_visibility || 'visible';

    if (kindFilter === 'workspace' && appKind !== 'workspace') return false;
    if (kindFilter === 'utility' && appKind !== 'utility') return false;
    if (kindFilter === 'all' && launcherVisibility === 'system') return false;

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
    if (!onPinApp) return;

    await onPinApp(app, isPinned);
    initializeComponent();
  };

  const handleFavoriteApp = async (app, isFavorite) => {
    if (!onFavoriteApp) return;

    await onFavoriteApp(app, isFavorite);
    initializeComponent();
  };

  return (
    <article className="card shadow">
      <section className="card-body">
        <header className="d-flex flex-row justify-content-between align-items-start">
          <section>
            <h4 className="mt-0 header-title">App Catalog</h4>
            <p className="text-muted font-14 mb-3">Browse, manage and launch your apps</p>
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
                <AddIcon className="me-1" fontSize="small" /> New App
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
              <StyledTab label="All Apps" value="all" />
              <StyledTab label="Workspaces" value="workspace" />
              <StyledTab label="Utilities" value="utility" />
            </StyledTabs>

            <TextField
              placeholder="Search apps..."
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
              sx={{ width: '320px' }}
            />
          </section>

          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <CircularProgress size={32} />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-1">
                {searchQuery ? 'No apps match your search' : 'No apps yet'}
              </p>
              <p className="text-muted small">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first app to get started'}
              </p>
              {!searchQuery && onCreateApp && (
                <button
                  className="btn btn-outline-dark btn-sm mt-2"
                  onClick={(event) => {
                    event.preventDefault();
                    handleCreateApp();
                  }}
                >
                  <AddIcon className="me-1" fontSize="small" /> Create App
                </button>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {filteredApps.map((app) => (
                <div className="col-12 col-sm-6 col-md-4 col-xl-3" key={app.id}>
                  <AppCatalogCard
                    app={app}
                    preference={preferences[app.id]}
                    onOpen={onOpenApp}
                    onEdit={onEditApp}
                    onDelete={handleDeleteApp}
                    onPin={onPinApp ? handlePinApp : undefined}
                    onFavorite={onFavoriteApp ? handleFavoriteApp : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </article>
  );
};

export default AppCatalogGrid;

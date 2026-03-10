import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import AppCatalogCard from './AppCatalogCard.component';

const GridContainer = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '16px',
});

const EmptyState = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '64px 24px',
  color: '#9CA3AF',
  gap: '16px',
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
  const [apps, setApps] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadApps = useCallback(async () => {
    if (!appDefinitionService) return;

    setIsLoading(true);

    try {
      const queryParams = { queryselector: 'all', exclude_status: 'deleted' };

      if (organizationId) {
        queryParams.queryselector = 'organization-id';
        queryParams.search = organizationId;
      }

      const response = await appDefinitionService.get(queryParams);

      if (response?.result?.items) {
        setApps(response.result.items);
      }
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setIsLoading(false);
    }
  }, [appDefinitionService, organizationId]);

  const loadPreferences = useCallback(async () => {
    if (!appPreferenceService) return;

    try {
      const response = await appPreferenceService.get({ queryselector: 'all', exclude_status: 'deleted' });

      if (response?.result?.items) {
        const prefsMap = {};
        for (const pref of response.result.items) {
          prefsMap[pref.app_definition_id] = pref;
        }
        setPreferences(prefsMap);

        if (onPreferencesLoaded) {
          onPreferencesLoaded(prefsMap);
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, [appPreferenceService, onPreferencesLoaded]);

  useEffect(() => {
    loadApps();
    loadPreferences();
  }, [loadApps, loadPreferences]);

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
    if (onCreateApp) {
      await onCreateApp();
      loadApps();
    }
  };

  const handleDeleteApp = async (app) => {
    if (onDeleteApp) {
      await onDeleteApp(app);
      loadApps();
    }
  };

  const handlePinApp = async (app, isPinned) => {
    if (onPinApp) {
      await onPinApp(app, isPinned);
      loadPreferences();
    }
  };

  const handleFavoriteApp = async (app, isFavorite) => {
    if (onFavoriteApp) {
      await onFavoriteApp(app, isFavorite);
      loadPreferences();
    }
  };

  return (
    <Box>
      <Tabs
        value={kindFilter}
        onChange={(e, value) => setKindFilter(value)}
        sx={{
          mb: 2,
          minHeight: '36px',
          '& .MuiTab-root': {
            minHeight: '36px',
            textTransform: 'none',
            color: '#9CA3AF',
            fontSize: '13px',
            '&.Mui-selected': { color: '#A78BFA' },
          },
          '& .MuiTabs-indicator': { backgroundColor: '#7C3AED' },
        }}
      >
        <Tab label="All Apps" value="all" />
        <Tab label="Workspaces" value="workspace" />
        <Tab label="Utilities" value="utility" />
      </Tabs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search apps..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#6B7280' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '320px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1F1E26',
              color: '#EAEAF0',
              borderRadius: '8px',
              '& fieldset': { borderColor: '#6B728040' },
              '&:hover fieldset': { borderColor: '#7C3AED' },
              '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
            },
          }}
        />
        {onCreateApp && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateApp}
            sx={{
              backgroundColor: '#7C3AED',
              '&:hover': { backgroundColor: '#6D28D9' },
              textTransform: 'none',
              borderRadius: '8px',
            }}
          >
            New App
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} />
        </Box>
      ) : filteredApps.length === 0 ? (
        <EmptyState>
          <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
            {searchQuery ? 'No apps match your search' : 'No apps yet'}
          </Typography>
          <Typography sx={{ fontSize: '13px' }}>
            {searchQuery ? 'Try a different search term' : 'Create your first app to get started'}
          </Typography>
          {!searchQuery && onCreateApp && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateApp}
              sx={{
                borderColor: '#7C3AED',
                color: '#7C3AED',
                '&:hover': { borderColor: '#6D28D9', backgroundColor: '#7C3AED10' },
                textTransform: 'none',
                mt: 1,
              }}
            >
              Create App
            </Button>
          )}
        </EmptyState>
      ) : (
        <GridContainer>
          {filteredApps.map((app) => (
            <AppCatalogCard
              key={app.id}
              app={app}
              preference={preferences[app.id]}
              onOpen={onOpenApp}
              onEdit={onEditApp}
              onDelete={handleDeleteApp}
              onPin={onPinApp ? handlePinApp : undefined}
              onFavorite={onFavoriteApp ? handleFavoriteApp : undefined}
            />
          ))}
        </GridContainer>
      )}
    </Box>
  );
};

export default AppCatalogGrid;

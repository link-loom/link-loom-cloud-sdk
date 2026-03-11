import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const PropertiesPanel = ({
  isOpen = true,
  onClose,
  appDefinition,
  onUpdateDefinition,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;
  const panelWidth = theme.propertiesPanelWidth || STUDIO_UI_DEFAULTS.theme.propertiesPanelWidth;

  const [activeTab, setActiveTab] = useState(0);

  const handleFieldChange = (field, value) => {
    if (onUpdateDefinition) {
      onUpdateDefinition({ ...appDefinition, [field]: value });
    }
  };

  const handleManifestFieldChange = (field, value) => {
    if (!onUpdateDefinition) return;
    const updatedManifest = { ...(appDefinition?.manifest || {}), [field]: value };
    if (field === 'launcher_visibility') {
      updatedManifest.launcher_visible = value === 'visible';
    }
    onUpdateDefinition({ ...appDefinition, manifest: updatedManifest });
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.inputBackground,
      color: theme.textPrimary,
      fontSize: '13px',
      '& fieldset': { borderColor: theme.border },
      '&:hover fieldset': { borderColor: theme.brandPrimary },
      '&.Mui-focused fieldset': { borderColor: theme.brandPrimary },
    },
  };

  const selectSx = {
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
    fontSize: '13px',
    '& fieldset': { borderColor: theme.border },
    '&:hover fieldset': { borderColor: theme.brandPrimary },
    '&.Mui-focused fieldset': { borderColor: theme.brandPrimary },
    '& .MuiSelect-icon': { color: theme.textMuted },
  };

  const fieldLabelSx = {
    color: theme.textSecondary,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        height: '100%',
        width: isOpen ? `${panelWidth}px` : '0px',
        minWidth: isOpen ? `${panelWidth}px` : '0px',
        backgroundColor: theme.panelBackground,
        borderLeft: isOpen ? `1px solid ${theme.border}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s, min-width 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.border}`,
          minHeight: '36px',
        }}
      >
        <Typography sx={{ color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {ui.propertiesTitle || STUDIO_UI_DEFAULTS.propertiesTitle}
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: theme.textMuted, padding: '2px' }}>
            <ChevronLeftIcon sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
          </IconButton>
        )}
      </div>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: '32px',
          borderBottom: `1px solid ${theme.border}`,
          '& .MuiTab-root': { minHeight: '32px', fontSize: '11px', textTransform: 'none', color: theme.textSecondary },
          '& .Mui-selected': { color: theme.textPrimary },
          '& .MuiTabs-indicator': { backgroundColor: theme.brandPrimary },
        }}
      >
        <Tab label={ui.tabGeneral || STUDIO_UI_DEFAULTS.tabGeneral} />
        <Tab label={ui.tabManifest || STUDIO_UI_DEFAULTS.tabManifest} />
        <Tab label={ui.tabRoutes || STUDIO_UI_DEFAULTS.tabRoutes} />
      </Tabs>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 0 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldName || STUDIO_UI_DEFAULTS.fieldName}</Typography>
              <TextField fullWidth size="small" value={appDefinition?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} sx={inputSx} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldSlug || STUDIO_UI_DEFAULTS.fieldSlug}</Typography>
              <TextField fullWidth size="small" value={appDefinition?.slug || ''} onChange={(e) => handleFieldChange('slug', e.target.value)} sx={inputSx} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldDescription || STUDIO_UI_DEFAULTS.fieldDescription}</Typography>
              <TextField fullWidth size="small" multiline rows={3} value={appDefinition?.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} sx={inputSx} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldCategory || STUDIO_UI_DEFAULTS.fieldCategory}</Typography>
              <TextField fullWidth size="small" value={appDefinition?.category || ''} onChange={(e) => handleFieldChange('category', e.target.value)} sx={inputSx} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldIcon || STUDIO_UI_DEFAULTS.fieldIcon}</Typography>
              <TextField fullWidth size="small" value={appDefinition?.icon || ''} onChange={(e) => handleFieldChange('icon', e.target.value)} sx={inputSx} />
            </div>
            {appDefinition?.tags?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Typography sx={fieldLabelSx}>{ui.fieldTags || STUDIO_UI_DEFAULTS.fieldTags}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {appDefinition.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: theme.brandPrimaryHighlight, color: theme.brandPrimarySubtle, fontSize: '11px', height: '22px' }} />
                  ))}
                </Box>
              </div>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldKind || STUDIO_UI_DEFAULTS.fieldKind}</Typography>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.kind || 'workspace'}
                onChange={(e) => handleManifestFieldChange('kind', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="workspace">{ui.kindWorkspace || STUDIO_UI_DEFAULTS.kindWorkspace}</MenuItem>
                <MenuItem value="utility">{ui.kindUtility || STUDIO_UI_DEFAULTS.kindUtility}</MenuItem>
              </Select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldLauncherVisibility || STUDIO_UI_DEFAULTS.fieldLauncherVisibility}</Typography>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.launcher_visibility || 'visible'}
                onChange={(e) => handleManifestFieldChange('launcher_visibility', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="visible">{ui.visibilityVisible || STUDIO_UI_DEFAULTS.visibilityVisible}</MenuItem>
                <MenuItem value="hidden">{ui.visibilityHidden || STUDIO_UI_DEFAULTS.visibilityHidden}</MenuItem>
                <MenuItem value="system">{ui.visibilitySystem || STUDIO_UI_DEFAULTS.visibilitySystem}</MenuItem>
              </Select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldEntryBehavior || STUDIO_UI_DEFAULTS.fieldEntryBehavior}</Typography>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.entry_behavior || 'home'}
                onChange={(e) => handleManifestFieldChange('entry_behavior', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="home">{ui.behaviorHome || STUDIO_UI_DEFAULTS.behaviorHome}</MenuItem>
                <MenuItem value="context-required">{ui.behaviorContextRequired || STUDIO_UI_DEFAULTS.behaviorContextRequired}</MenuItem>
                <MenuItem value="route-only">{ui.behaviorRouteOnly || STUDIO_UI_DEFAULTS.behaviorRouteOnly}</MenuItem>
              </Select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldPinnable || STUDIO_UI_DEFAULTS.fieldPinnable}</Typography>
              <Switch
                checked={appDefinition?.manifest?.pinnable !== false}
                onChange={(e) => handleManifestFieldChange('pinnable', e.target.checked)}
                size="small"
                sx={{ '& .Mui-checked': { color: theme.brandPrimary }, '& .Mui-checked + .MuiSwitch-track': { backgroundColor: theme.brandPrimary } }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldRequiresContext || STUDIO_UI_DEFAULTS.fieldRequiresContext}</Typography>
              <Switch
                checked={appDefinition?.manifest?.requires_context || false}
                onChange={(e) => handleManifestFieldChange('requires_context', e.target.checked)}
                size="small"
                sx={{ '& .Mui-checked': { color: theme.brandPrimary }, '& .Mui-checked + .MuiSwitch-track': { backgroundColor: theme.brandPrimary } }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldEntryRoute || STUDIO_UI_DEFAULTS.fieldEntryRoute}</Typography>
              <TextField
                fullWidth
                size="small"
                value={appDefinition?.manifest?.entry_route || '/'}
                onChange={(e) => handleManifestFieldChange('entry_route', e.target.value)}
                sx={inputSx}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Typography sx={fieldLabelSx}>{ui.fieldAdvancedJson || STUDIO_UI_DEFAULTS.fieldAdvancedJson}</Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={6}
                value={appDefinition?.manifest ? JSON.stringify(appDefinition.manifest, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    handleFieldChange('manifest', JSON.parse(e.target.value));
                  } catch (_) { /* ignore parse errors during typing */ }
                }}
                sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], fontFamily: 'monospace', fontSize: '12px' } }}
              />
            </div>
          </>
        )}

        {activeTab === 2 && (
          <div style={{ marginBottom: '16px' }}>
            <Typography sx={fieldLabelSx}>{ui.tabRoutes || STUDIO_UI_DEFAULTS.tabRoutes}</Typography>
            {appDefinition?.routes?.length > 0 ? (
              appDefinition.routes.map((route, i) => (
                <Box key={i} sx={{ mb: 1, p: 1, backgroundColor: theme.inputBackground, borderRadius: '6px' }}>
                  <Typography sx={{ color: theme.textPrimary, fontSize: '12px', fontWeight: 500 }}>{route.path || '/'}</Typography>
                  <Typography sx={{ color: theme.textSecondary, fontSize: '11px' }}>{route.name || (ui.unnamedRoute || STUDIO_UI_DEFAULTS.unnamedRoute)}</Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: theme.textMuted, fontSize: '12px' }}>{ui.noRoutes || STUDIO_UI_DEFAULTS.noRoutes}</Typography>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;

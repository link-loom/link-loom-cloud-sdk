import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
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

const PanelContainer = styled('div')(({ $isOpen }) => ({
  height: '100%',
  width: $isOpen ? '300px' : '0px',
  minWidth: $isOpen ? '300px' : '0px',
  backgroundColor: '#1F1E26',
  borderLeft: $isOpen ? '1px solid #6B728040' : 'none',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'width 0.2s, min-width 0.2s',
}));

const PanelHeader = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #6B728040',
  minHeight: '36px',
});

const PanelContent = styled('div')({
  flex: 1,
  overflowY: 'auto',
  padding: '12px',
});

const FieldGroup = styled('div')({
  marginBottom: '16px',
});

const FieldLabel = styled(Typography)({
  color: '#9CA3AF',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
});

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#2B2A33',
    color: '#EAEAF0',
    fontSize: '13px',
    '& fieldset': { borderColor: '#6B728040' },
    '&:hover fieldset': { borderColor: '#7C3AED' },
    '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
  },
};

const selectSx = {
  backgroundColor: '#2B2A33',
  color: '#EAEAF0',
  fontSize: '13px',
  '& fieldset': { borderColor: '#6B728040' },
  '&:hover fieldset': { borderColor: '#7C3AED' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
  '& .MuiSelect-icon': { color: '#6B7280' },
};

const PropertiesPanel = ({
  isOpen = true,
  onClose,
  appDefinition,
  onUpdateDefinition,
}) => {
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

  return (
    <PanelContainer $isOpen={isOpen}>
      <PanelHeader>
        <Typography sx={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Properties
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280', padding: '2px' }}>
            <ChevronLeftIcon sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
          </IconButton>
        )}
      </PanelHeader>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: '32px',
          borderBottom: '1px solid #6B728040',
          '& .MuiTab-root': { minHeight: '32px', fontSize: '11px', textTransform: 'none', color: '#9CA3AF' },
          '& .Mui-selected': { color: '#EAEAF0' },
          '& .MuiTabs-indicator': { backgroundColor: '#7C3AED' },
        }}
      >
        <Tab label="General" />
        <Tab label="Manifest" />
        <Tab label="Routes" />
      </Tabs>

      <PanelContent>
        {activeTab === 0 && (
          <>
            <FieldGroup>
              <FieldLabel>Name</FieldLabel>
              <TextField fullWidth size="small" value={appDefinition?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} sx={inputSx} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Slug</FieldLabel>
              <TextField fullWidth size="small" value={appDefinition?.slug || ''} onChange={(e) => handleFieldChange('slug', e.target.value)} sx={inputSx} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Description</FieldLabel>
              <TextField fullWidth size="small" multiline rows={3} value={appDefinition?.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} sx={inputSx} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Category</FieldLabel>
              <TextField fullWidth size="small" value={appDefinition?.category || ''} onChange={(e) => handleFieldChange('category', e.target.value)} sx={inputSx} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Icon</FieldLabel>
              <TextField fullWidth size="small" value={appDefinition?.icon || ''} onChange={(e) => handleFieldChange('icon', e.target.value)} sx={inputSx} />
            </FieldGroup>
            {appDefinition?.tags?.length > 0 && (
              <FieldGroup>
                <FieldLabel>Tags</FieldLabel>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {appDefinition.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: '#7C3AED20', color: '#A78BFA', fontSize: '11px', height: '22px' }} />
                  ))}
                </Box>
              </FieldGroup>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            <FieldGroup>
              <FieldLabel>Kind</FieldLabel>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.kind || 'workspace'}
                onChange={(e) => handleManifestFieldChange('kind', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="workspace">Workspace</MenuItem>
                <MenuItem value="utility">Utility</MenuItem>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Launcher Visibility</FieldLabel>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.launcher_visibility || 'visible'}
                onChange={(e) => handleManifestFieldChange('launcher_visibility', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="visible">Visible</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Entry Behavior</FieldLabel>
              <Select
                fullWidth
                size="small"
                value={appDefinition?.manifest?.entry_behavior || 'home'}
                onChange={(e) => handleManifestFieldChange('entry_behavior', e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="context-required">Context Required</MenuItem>
                <MenuItem value="route-only">Route Only</MenuItem>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Pinnable</FieldLabel>
              <Switch
                checked={appDefinition?.manifest?.pinnable !== false}
                onChange={(e) => handleManifestFieldChange('pinnable', e.target.checked)}
                size="small"
                sx={{ '& .Mui-checked': { color: '#7C3AED' }, '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#7C3AED' } }}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Requires Context</FieldLabel>
              <Switch
                checked={appDefinition?.manifest?.requires_context || false}
                onChange={(e) => handleManifestFieldChange('requires_context', e.target.checked)}
                size="small"
                sx={{ '& .Mui-checked': { color: '#7C3AED' }, '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#7C3AED' } }}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Entry Route</FieldLabel>
              <TextField
                fullWidth
                size="small"
                value={appDefinition?.manifest?.entry_route || '/'}
                onChange={(e) => handleManifestFieldChange('entry_route', e.target.value)}
                sx={inputSx}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Advanced (JSON)</FieldLabel>
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
            </FieldGroup>
          </>
        )}

        {activeTab === 2 && (
          <FieldGroup>
            <FieldLabel>Routes</FieldLabel>
            {appDefinition?.routes?.length > 0 ? (
              appDefinition.routes.map((route, i) => (
                <Box key={i} sx={{ mb: 1, p: 1, backgroundColor: '#2B2A33', borderRadius: '6px' }}>
                  <Typography sx={{ color: '#EAEAF0', fontSize: '12px', fontWeight: 500 }}>{route.path || '/'}</Typography>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '11px' }}>{route.name || 'Unnamed route'}</Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: '#6B7280', fontSize: '12px' }}>No routes defined</Typography>
            )}
          </FieldGroup>
        )}
      </PanelContent>
    </PanelContainer>
  );
};

export default PropertiesPanel;

import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import ExplorerIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PropertiesIcon from '@mui/icons-material/Tune';
import RunIcon from '@mui/icons-material/PestControl';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const PANELS = [
  { id: 'explorer', icon: ExplorerIcon, label: 'Explorer' },
  { id: 'properties', icon: PropertiesIcon, label: 'Properties' },
  { id: 'run', icon: RunIcon, label: 'Run & Build' },
];

const ActivityBar = ({
  activePanel,
  onPanelChange,
  editorTheme,
  onToggleEditorTheme,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  const handlePanelClick = (panelId) => {
    onPanelChange(activePanel === panelId ? null : panelId);
  };

  return (
    <div
      style={{
        width: '48px',
        minWidth: '48px',
        height: '100%',
        backgroundColor: theme.panelBackground,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '4px',
        paddingBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        {PANELS.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id} title={label} placement="right" arrow>
            <IconButton
              size="small"
              onClick={() => handlePanelClick(id)}
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '0',
                color: activePanel === id ? theme.textPrimary : theme.textMuted,
                borderLeft: activePanel === id ? `2px solid ${theme.brandPrimary}` : '2px solid transparent',
                '&:hover': { color: theme.textPrimary },
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Tooltip title="Settings" placement="right" arrow>
          <IconButton
            size="small"
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            sx={{
              width: '40px',
              height: '40px',
              borderRadius: '0',
              color: theme.textMuted,
              '&:hover': { color: theme.textPrimary },
            }}
          >
            <SettingsIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                backgroundColor: theme.panelBackground,
                color: theme.textPrimary,
                border: `1px solid ${theme.border}`,
                minWidth: '180px',
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onToggleEditorTheme();
              setSettingsAnchor(null);
            }}
            sx={{ fontSize: '13px', '&:hover': { backgroundColor: `${theme.brandPrimary}20` } }}
          >
            <ListItemIcon sx={{ color: theme.textMuted }}>
              {editorTheme === 'vs-dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '13px' }}>
              {editorTheme === 'vs-dark' ? 'Light Theme' : 'Dark Theme'}
            </ListItemText>
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default ActivityBar;

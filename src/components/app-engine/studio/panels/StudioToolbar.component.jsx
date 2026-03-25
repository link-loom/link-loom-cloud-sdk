import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const StudioToolbar = ({
  appName,
  isSaving,
  isDirty,
  buildStatus,
  onBack,
  onSave,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;

  const getBuildStatusColors = () => {
    if (buildStatus === 'success') return { bg: `${theme.success}20`, color: theme.success };
    if (buildStatus === 'building') return { bg: `${theme.brandPrimary}20`, color: theme.brandPrimary };
    if (buildStatus === 'failed') return { bg: `${theme.error}20`, color: theme.error };
    return null;
  };

  const statusColors = getBuildStatusColors();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        backgroundColor: theme.panelBackground,
        borderBottom: `1px solid ${theme.border}`,
        height: '36px',
        minHeight: '36px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onBack && (
          <IconButton size="small" onClick={onBack} sx={{ color: theme.textSecondary, padding: '4px' }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <Typography sx={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 500 }}>
          {appName || ui.untitledApp || STUDIO_UI_DEFAULTS.untitledApp}
        </Typography>
        {isDirty && (
          <Chip
            label="Unsaved"
            size="small"
            sx={{ backgroundColor: theme.warningBackground, color: theme.warning, fontSize: '10px', height: '18px' }}
          />
        )}
        {statusColors && (
          <Chip
            label={buildStatus}
            size="small"
            sx={{ backgroundColor: statusColors.bg, color: statusColors.color, fontSize: '10px', height: '18px', textTransform: 'capitalize' }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onSave && (
          <Button
            variant="text"
            size="small"
            startIcon={isSaving ? <CircularProgress size={12} sx={{ color: theme.brandPrimary }} /> : <SaveIcon sx={{ fontSize: 12 }} />}
            onClick={onSave}
            disabled={isSaving || !isDirty}
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              padding: '2px 8px',
              minWidth: 'auto',
              color: theme.textSecondary,
              '&:hover': { color: theme.textPrimary, backgroundColor: `${theme.brandPrimary}10` },
              '&.Mui-disabled': { color: `${theme.textMuted}60` },
            }}
          >
            Save
          </Button>
        )}
      </Box>
    </div>
  );
};

export default StudioToolbar;

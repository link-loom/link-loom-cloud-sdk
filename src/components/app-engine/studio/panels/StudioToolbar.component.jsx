import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import PublishIcon from '@mui/icons-material/Publish';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const StudioToolbar = ({
  appName,
  isSaving,
  isDirty,
  buildStatus,
  isPublishing,
  isPreviewing,
  onBack,
  onSave,
  onBuild,
  onPublish,
  onPreview,
  onRun,
  onToggleProperties,
  isPropertiesOpen,
  ui = STUDIO_UI_DEFAULTS,
  renderExtraActions,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;

  const getBuildStatusColors = () => {
    if (buildStatus === 'success') return { bg: `${theme.success}20`, color: theme.success };
    if (buildStatus === 'building') return { bg: theme.brandPrimaryHighlight, color: theme.brandPrimary };
    if (buildStatus === 'failed') return { bg: `${theme.error}20`, color: theme.error };
    return { bg: `${theme.textMuted}20`, color: theme.textMuted };
  };

  const outlinedButtonSx = {
    textTransform: 'none',
    fontSize: '12px',
    borderRadius: '6px',
    padding: '4px 12px',
    minWidth: 'auto',
    borderColor: theme.border,
    color: theme.textPrimary,
    '&:hover': { borderColor: theme.brandPrimary, backgroundColor: `${theme.brandPrimary}10` },
    '&.Mui-disabled': { borderColor: `${theme.textMuted}20`, color: theme.textMuted },
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: theme.panelBackground,
        borderBottom: `1px solid ${theme.border}`,
        minHeight: `${theme.toolbarMinHeight}px`,
        gap: '12px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <IconButton size="small" onClick={onBack} sx={{ color: theme.textSecondary }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Typography sx={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600 }}>
          {appName || ui.untitledApp || STUDIO_UI_DEFAULTS.untitledApp}
        </Typography>
        {isDirty && (
          <Chip
            label={ui.unsavedLabel || STUDIO_UI_DEFAULTS.unsavedLabel}
            size="small"
            sx={{ backgroundColor: theme.warningBackground, color: theme.warning, fontSize: '10px', height: '20px' }}
          />
        )}
        {buildStatus && (() => {
          const statusColors = getBuildStatusColors();
          return (
            <Chip
              label={buildStatus}
              size="small"
              sx={{ backgroundColor: statusColors.bg, color: statusColors.color, fontSize: '10px', height: '20px' }}
            />
          );
        })()}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {renderExtraActions && renderExtraActions({ theme, ui })}

        {onToggleProperties && (
          <IconButton
            size="small"
            onClick={onToggleProperties}
            sx={{ color: isPropertiesOpen ? theme.brandPrimary : theme.textMuted }}
          >
            <ViewSidebarIcon fontSize="small" />
          </IconButton>
        )}

        {onSave && (
          <Button
            variant="outlined"
            startIcon={isSaving ? <CircularProgress size={14} sx={{ color: theme.brandPrimary }} /> : <SaveIcon sx={{ fontSize: 14 }} />}
            onClick={onSave}
            disabled={isSaving || !isDirty}
            sx={outlinedButtonSx}
          >
            {ui.saveLabel || STUDIO_UI_DEFAULTS.saveLabel}
          </Button>
        )}

        {onBuild && (
          <Button
            variant="outlined"
            startIcon={buildStatus === 'building' ? <CircularProgress size={14} sx={{ color: theme.brandPrimary }} /> : <BuildIcon sx={{ fontSize: 14 }} />}
            onClick={onBuild}
            disabled={buildStatus === 'building'}
            sx={outlinedButtonSx}
          >
            {ui.buildLabel || STUDIO_UI_DEFAULTS.buildLabel}
          </Button>
        )}

        {onPreview && (
          <Button
            variant="outlined"
            startIcon={isPreviewing ? <CircularProgress size={14} sx={{ color: theme.textPrimary }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
            onClick={onPreview}
            disabled={isPreviewing}
            sx={outlinedButtonSx}
          >
            {ui.previewLabel || STUDIO_UI_DEFAULTS.previewLabel}
          </Button>
        )}

        {onPublish && (
          <Button
            variant="contained"
            startIcon={isPublishing ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <PublishIcon sx={{ fontSize: 14 }} />}
            onClick={onPublish}
            disabled={isPublishing}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              borderRadius: '6px',
              padding: '4px 12px',
              minWidth: 'auto',
              backgroundColor: theme.brandPrimary,
              '&:hover': { backgroundColor: theme.brandPrimaryHover },
              '&.Mui-disabled': { backgroundColor: `${theme.brandPrimary}80`, color: '#ffffff80' },
            }}
          >
            {ui.publishLabel || STUDIO_UI_DEFAULTS.publishLabel}
          </Button>
        )}

        {onRun && (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
            onClick={onRun}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              borderRadius: '6px',
              padding: '4px 12px',
              minWidth: 'auto',
              backgroundColor: theme.success,
              '&:hover': { backgroundColor: theme.successHover },
            }}
          >
            {ui.runLabel || STUDIO_UI_DEFAULTS.runLabel}
          </Button>
        )}
      </Box>
    </div>
  );
};

export default StudioToolbar;

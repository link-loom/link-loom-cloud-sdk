import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import BuildIcon from '@mui/icons-material/Build';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublishIcon from '@mui/icons-material/Publish';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const RunPanel = ({
  buildStatus,
  isPublishing,
  hasBuild,
  isPublished,
  onBuild,
  onPreview,
  onPublish,
  onRun,
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

  const buttonSx = {
    textTransform: 'none',
    fontSize: '12px',
    borderRadius: '4px',
    padding: '6px 12px',
    justifyContent: 'flex-start',
    width: '100%',
    color: theme.textPrimary,
    borderColor: theme.border,
    '&:hover': { borderColor: theme.textMuted, backgroundColor: `${theme.brandPrimary}10` },
    '&.Mui-disabled': { color: `${theme.textMuted}80`, borderColor: `${theme.border}60` },
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          minHeight: '36px',
        }}
      >
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Run & Build
        </Typography>
      </div>

      <Box sx={{ px: '12px', pb: '12px' }}>
        {statusColors && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={buildStatus}
              size="small"
              sx={{
                fontSize: '11px',
                height: '22px',
                backgroundColor: statusColors.bg,
                color: statusColors.color,
                textTransform: 'capitalize',
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="outlined"
            startIcon={
              buildStatus === 'building' ? (
                <CircularProgress size={14} sx={{ color: theme.brandPrimary }} />
              ) : (
                <BuildIcon sx={{ fontSize: 14 }} />
              )
            }
            onClick={onBuild}
            disabled={buildStatus === 'building'}
            sx={buttonSx}
          >
            Build
          </Button>

          <Button
            variant="outlined"
            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
            onClick={onPreview}
            disabled={!hasBuild}
            sx={buttonSx}
          >
            Preview
          </Button>

          <Button
            variant="outlined"
            startIcon={
              isPublishing ? (
                <CircularProgress size={14} sx={{ color: theme.brandPrimary }} />
              ) : (
                <PublishIcon sx={{ fontSize: 14 }} />
              )
            }
            onClick={onPublish}
            disabled={isPublishing || !hasBuild}
            sx={buttonSx}
          >
            Publish
          </Button>

          <Box sx={{ borderTop: `1px solid ${theme.border}`, pt: '8px', mt: '4px' }}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
              onClick={onRun}
              disabled={!isPublished}
              sx={{
                ...buttonSx,
                backgroundColor: theme.success,
                color: '#fff',
                borderColor: 'transparent',
                justifyContent: 'center',
                '&:hover': { backgroundColor: theme.successHover },
                '&.Mui-disabled': {
                  backgroundColor: `${theme.success}40`,
                  color: '#ffffff60',
                  borderColor: 'transparent',
                },
              }}
            >
              Run App
            </Button>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default RunPanel;

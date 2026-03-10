import React from 'react';
import { styled } from '@mui/material/styles';
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

const ToolbarContainer = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px',
  backgroundColor: '#1F1E26',
  borderBottom: '1px solid #6B728040',
  minHeight: '48px',
  gap: '12px',
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  fontSize: '12px',
  borderRadius: '6px',
  padding: '4px 12px',
  minWidth: 'auto',
});

const StudioToolbar = ({
  appName,
  isSaving,
  isDirty,
  buildStatus,
  onBack,
  onSave,
  onBuild,
  onPublish,
  onPreview,
  onRun,
  onToggleProperties,
  isPropertiesOpen,
}) => {
  return (
    <ToolbarContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <IconButton size="small" onClick={onBack} sx={{ color: '#9CA3AF' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Typography sx={{ color: '#EAEAF0', fontSize: '14px', fontWeight: 600 }}>
          {appName || 'Untitled App'}
        </Typography>
        {isDirty && (
          <Chip
            label="Unsaved"
            size="small"
            sx={{ backgroundColor: '#F59E0B20', color: '#F59E0B', fontSize: '10px', height: '20px' }}
          />
        )}
        {buildStatus && (
          <Chip
            label={buildStatus}
            size="small"
            sx={{
              backgroundColor: buildStatus === 'success' ? '#10B98120' : buildStatus === 'building' ? '#7C3AED20' : buildStatus === 'failed' ? '#EF444420' : '#6B728020',
              color: buildStatus === 'success' ? '#10B981' : buildStatus === 'building' ? '#7C3AED' : buildStatus === 'failed' ? '#EF4444' : '#6B7280',
              fontSize: '10px',
              height: '20px',
            }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onToggleProperties && (
          <IconButton
            size="small"
            onClick={onToggleProperties}
            sx={{ color: isPropertiesOpen ? '#7C3AED' : '#6B7280' }}
          >
            <ViewSidebarIcon fontSize="small" />
          </IconButton>
        )}

        {onSave && (
          <ActionButton
            variant="outlined"
            startIcon={isSaving ? <CircularProgress size={14} sx={{ color: '#7C3AED' }} /> : <SaveIcon sx={{ fontSize: 14 }} />}
            onClick={onSave}
            disabled={isSaving || !isDirty}
            sx={{
              borderColor: '#6B728040',
              color: '#EAEAF0',
              '&:hover': { borderColor: '#7C3AED', backgroundColor: '#7C3AED10' },
              '&.Mui-disabled': { borderColor: '#6B728020', color: '#6B7280' },
            }}
          >
            Save
          </ActionButton>
        )}

        {onBuild && (
          <ActionButton
            variant="outlined"
            startIcon={buildStatus === 'building' ? <CircularProgress size={14} sx={{ color: '#7C3AED' }} /> : <BuildIcon sx={{ fontSize: 14 }} />}
            onClick={onBuild}
            disabled={buildStatus === 'building'}
            sx={{
              borderColor: '#6B728040',
              color: '#EAEAF0',
              '&:hover': { borderColor: '#7C3AED', backgroundColor: '#7C3AED10' },
              '&.Mui-disabled': { borderColor: '#6B728020', color: '#6B7280' },
            }}
          >
            Build
          </ActionButton>
        )}

        {onPreview && (
          <ActionButton
            variant="outlined"
            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
            onClick={onPreview}
            sx={{
              borderColor: '#6B728040',
              color: '#EAEAF0',
              '&:hover': { borderColor: '#7C3AED', backgroundColor: '#7C3AED10' },
            }}
          >
            Preview
          </ActionButton>
        )}

        {onPublish && (
          <ActionButton
            variant="contained"
            startIcon={<PublishIcon sx={{ fontSize: 14 }} />}
            onClick={onPublish}
            sx={{
              backgroundColor: '#7C3AED',
              '&:hover': { backgroundColor: '#6D28D9' },
            }}
          >
            Publish
          </ActionButton>
        )}

        {onRun && (
          <ActionButton
            variant="contained"
            startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
            onClick={onRun}
            sx={{
              backgroundColor: '#10B981',
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            Run
          </ActionButton>
        )}
      </Box>
    </ToolbarContainer>
  );
};

export default StudioToolbar;

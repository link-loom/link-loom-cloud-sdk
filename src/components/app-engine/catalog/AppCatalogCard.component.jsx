import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';

const CardContainer = styled('div')(({ theme }) => ({
  backgroundColor: '#2B2A33',
  border: '1px solid #6B728040',
  borderRadius: '12px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: '160px',
  '&:hover': {
    borderColor: '#7C3AED',
    boxShadow: '0 0 0 1px #7C3AED40',
  },
}));

const AppIcon = styled('div')(({ $color }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  backgroundColor: $color || '#7C3AED20',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
}));

const AppCatalogCard = ({
  app,
  onOpen,
  onEdit,
  onDelete,
  onPin,
  onFavorite,
  preference,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    if (onOpen) {
      onOpen(app);
    }
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(app);
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(app);
    }
  };

  const isPinnable = app?.manifest?.pinnable !== false;

  const handlePin = (event) => {
    event.stopPropagation();
    if (onPin && isPinnable) {
      onPin(app, !preference?.is_pinned);
    }
  };

  const handleFavorite = (event) => {
    event.stopPropagation();
    if (onFavorite) {
      onFavorite(app, !preference?.is_favorite);
    }
  };

  return (
    <CardContainer onClick={handleOpen}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <AppIcon $color={app?.icon ? undefined : '#7C3AED20'}>
          {app?.icon || '📱'}
        </AppIcon>
        <Box sx={{ display: 'flex', gap: '4px' }}>
          {onFavorite && (
            <IconButton size="small" onClick={handleFavorite} sx={{ color: preference?.is_favorite ? '#F59E0B' : '#6B7280' }}>
              <StarIcon fontSize="small" />
            </IconButton>
          )}
          {onPin && isPinnable && (
            <IconButton size="small" onClick={handlePin} sx={{ color: preference?.is_pinned ? '#7C3AED' : '#6B7280' }}>
              <PushPinIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={handleMenuOpen} sx={{ color: '#6B7280' }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: '#EAEAF0', fontWeight: 600, fontSize: '14px', mb: '4px' }}>
          {app?.name || 'Untitled App'}
        </Typography>
        <Typography sx={{ color: '#9CA3AF', fontSize: '12px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {app?.description || 'No description'}
        </Typography>
      </Box>

      {app?.category && (
        <Box>
          <Chip label={app.category} size="small" sx={{ backgroundColor: '#7C3AED20', color: '#A78BFA', fontSize: '11px', height: '22px' }} />
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpen}>Open</MenuItem>
        <MenuItem onClick={handleEdit}>Edit in Studio</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#EF4444' }}>Delete</MenuItem>
      </Menu>
    </CardContainer>
  );
};

export default AppCatalogCard;

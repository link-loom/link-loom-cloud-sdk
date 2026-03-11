import React, { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const CardArticle = styled('article')({
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  '&:hover': {
    borderColor: '#6c757d',
    boxShadow: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
  },
});

const AppIconWrapper = styled('div')(({ $color }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  backgroundColor: $color || '#f0e7ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
}));

const AppCatalogCard = ({ app, onOpen, onEdit, onDelete, onPin, onFavorite, preference }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuActionRef = useRef(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    if (menuActionRef.current) return;
    if (onOpen) onOpen(app);
  };

  const handleEdit = () => {
    menuActionRef.current = true;
    handleMenuClose();
    if (onEdit) onEdit(app);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const handleDelete = () => {
    menuActionRef.current = true;
    handleMenuClose();
    if (onDelete) onDelete(app);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const isPinnable = app?.manifest?.pinnable !== false;

  const handlePin = (event) => {
    event.stopPropagation();
    if (onPin && isPinnable) onPin(app, !preference?.is_pinned);
  };

  const handleFavorite = (event) => {
    event.stopPropagation();
    if (onFavorite) onFavorite(app, !preference?.is_favorite);
  };

  return (
    <CardArticle className="card h-100 shadow-sm" onClick={handleOpen}>
      <section className="card-body d-flex flex-column gap-2">
        <header className="d-flex justify-content-between align-items-start">
          <AppIconWrapper $color={app?.icon ? undefined : '#f0e7ff'}>
            {app?.icon || '\uD83D\uDCF1'}
          </AppIconWrapper>
          <div className="d-flex gap-1">
            {onFavorite && (
              <IconButton
                size="small"
                onClick={handleFavorite}
                sx={{ color: preference?.is_favorite ? '#F59E0B' : '#9CA3AF' }}
              >
                <StarIcon fontSize="small" />
              </IconButton>
            )}
            {onPin && isPinnable && (
              <IconButton
                size="small"
                onClick={handlePin}
                sx={{ color: preference?.is_pinned ? '#6D28D9' : '#9CA3AF' }}
              >
                <PushPinIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={handleMenuOpen} sx={{ color: '#9CA3AF' }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </div>
        </header>

        <div className="flex-grow-1">
          <h6 className="mb-1">{app?.name || 'Untitled App'}</h6>
          <p
            className="text-muted small mb-0"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {app?.description || 'No description'}
          </p>
        </div>

        {app?.category && (
          <div>
            <Chip label={app.category} size="small" />
          </div>
        )}

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleOpen}>Open</MenuItem>
          <MenuItem onClick={handleEdit}>Edit in Studio</MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: '#EF4444' }}>
            Delete
          </MenuItem>
        </Menu>
      </section>
    </CardArticle>
  );
};

export default AppCatalogCard;

import React, { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CodeIcon from '@mui/icons-material/Code';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CategoryIcon from '@mui/icons-material/Category';
import { MARKETPLACE_UI_DEFAULTS, mergeDefaults } from '../defaults/appEngine.defaults';

const CardArticle = styled('article')(({ $hoverBorderColor, $hoverShadow }) => ({
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  '&:hover': {
    borderColor: $hoverBorderColor,
    boxShadow: $hoverShadow,
  },
}));

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

const AppMarketplaceCard = ({
  app,
  ui,
  onOpen,
  onEdit,
  onDelete,
  onPin,
  onFavorite,
  preference,
  className = '',
  renderContainer,
}) => {
  const config = mergeDefaults(MARKETPLACE_UI_DEFAULTS, ui);
  const theme = config.theme;

  const [anchorEl, setAnchorEl] = useState(null);
  const menuActionRef = useRef(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleOpen = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    if (menuActionRef.current) return;
    if (onOpen) onOpen(app);
  };

  const handleEdit = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    menuActionRef.current = true;
    handleMenuClose(event);
    if (onEdit) onEdit(app);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const handleDelete = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    menuActionRef.current = true;
    handleMenuClose(event);
    if (onDelete) onDelete(app);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const isPinnable = app?.manifest?.pinnable !== false;

  const handlePinAction = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    menuActionRef.current = true;
    handleMenuClose(event);
    if (onPin && isPinnable) onPin(app, !preference?.is_pinned);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const handleFavoriteAction = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    menuActionRef.current = true;
    handleMenuClose(event);
    if (onFavorite) onFavorite(app, !preference?.is_favorite);
    setTimeout(() => { menuActionRef.current = false; }, 0);
  };

  const cardContent = (
    <section className="card-body d-flex flex-column gap-2">
      <header className="d-flex justify-content-between align-items-start">
        <AppIconWrapper $color={app?.icon ? undefined : theme.iconDefaultBackground}>
          {app?.icon || <CategoryIcon />}
        </AppIconWrapper>
        <div className="d-flex gap-1 align-items-center">
          {preference?.is_favorite && (
            <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} titleAccess="Favorited" />
          )}
          {preference?.is_pinned && isPinnable && (
            <PushPinIcon sx={{ fontSize: 16, color: '#6D28D9' }} titleAccess="Pinned" />
          )}
          <IconButton size="small" onClick={handleMenuOpen} sx={{ color: theme.menuIcon }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </div>
      </header>

      <div className="flex-grow-1">
        <h6 className="mb-1">{app?.name || config.untitledApp}</h6>
        <p
          className="text-muted small mb-0"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {app?.description || config.noDescription}
        </p>
      </div>

      {app?.category && (
        <div>
          <Chip label={app.category} size="small" />
        </div>
      )}

      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose}
        onClick={(e) => {
          if (e && e.stopPropagation) {
            e.stopPropagation();
          }
        }}
        PaperProps={{
          elevation: 3,
          sx: { 
            minWidth: 200, 
            borderRadius: 2, 
            mt: 0.5, 
            '& .MuiMenuItem-root': { py: 0.5, px: 1.5, minHeight: 'auto' },
            '& .MuiListItemIcon-root': { minWidth: 28 }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={(e) => { handleMenuClose(e); handleOpen(); }}>
          <ListItemIcon><PlayArrowIcon sx={{ fontSize: 18, color: '#10B981' }} /></ListItemIcon>
          <ListItemText primary={config.menuOpen} secondary="Launch application" primaryTypographyProps={{fontSize: 13, fontWeight: 500}} secondaryTypographyProps={{fontSize: 11, lineHeight: 1.2}} />
        </MenuItem>

        {onFavorite && (
          <MenuItem onClick={handleFavoriteAction}>
            <ListItemIcon>
              {preference?.is_favorite ? 
                <StarIcon sx={{ fontSize: 18, color: '#F59E0B' }} /> : 
                <StarBorderIcon sx={{ fontSize: 18, color: '#6B7280' }} />
              }
            </ListItemIcon>
            <ListItemText primary={preference?.is_favorite ? config.removeFromFavorites : config.addToFavorites} primaryTypographyProps={{fontSize: 13, fontWeight: 500}} />
          </MenuItem>
        )}

        {onPin && isPinnable && (
          <MenuItem onClick={handlePinAction}>
            <ListItemIcon>
              {preference?.is_pinned ? 
                <PushPinIcon sx={{ fontSize: 18, color: '#6D28D9' }} /> : 
                <PushPinOutlinedIcon sx={{ fontSize: 18, color: '#6B7280' }} />
              }
            </ListItemIcon>
            <ListItemText primary={preference?.is_pinned ? config.unpin : config.pin} secondary={preference?.is_pinned ? "Remove from launcher" : "Pin to launcher"} primaryTypographyProps={{fontSize: 13, fontWeight: 500}} secondaryTypographyProps={{fontSize: 11, lineHeight: 1.2}} />
          </MenuItem>
        )}
        
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><CodeIcon sx={{ fontSize: 18, color: '#7C3AED' }} /></ListItemIcon>
          <ListItemText primary="App Studio" secondary="Advanced builders & configuration" primaryTypographyProps={{fontSize: 13, fontWeight: 500}} secondaryTypographyProps={{fontSize: 11, lineHeight: 1.2}} />
        </MenuItem>
        
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem onClick={handleDelete} sx={{ color: theme.deleteColor }}>
          <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 18, color: theme.deleteColor }} /></ListItemIcon>
          <ListItemText primary={config.menuDelete} primaryTypographyProps={{fontSize: 13, fontWeight: 500}} />
        </MenuItem>
      </Menu>
    </section>
  );

  if (renderContainer) {
    return renderContainer({ children: cardContent, onClick: handleOpen });
  }

  return (
    <CardArticle
      className={`card h-100 shadow-sm ${className}`.trim()}
      onClick={handleOpen}
      $hoverBorderColor={theme.hoverBorderColor}
      $hoverShadow={theme.hoverShadow}
    >
      {cardContent}
    </CardArticle>
  );
};

export default AppMarketplaceCard;

import React, { useState } from "react";
import { IconButton, Tooltip, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Star as StarFilledIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME, alpha } from "../../defaults/launchpad.theme";
import AppStorePublisherPillComponent from "./AppStorePublisherPill.component";
import CatalogAppIconComponent, { hasSvgAppIcon } from "../../CatalogAppIcon.component";
import { getCategoryTint } from "../../categoryIcon.util";

const KIND_STYLES = {
  workspace: { bg: "#EDE9FE", color: "#6D28D9" },
  utility: { bg: "#D1FAE5", color: "#059669" },
  hitl: { bg: "#DBEAFE", color: "#1D4ED8" },
  analytics: { bg: "#FEF3C7", color: "#92400E" },
  ai: { bg: "#FFE4E6", color: "#BE123C" },
  integration: { bg: "#CFFAFE", color: "#0E7490" },
};

const CardWrapper = styled.div`
  min-height: 200px;
  border-radius: 16px;
  background-color: ${({ $isSelected }) => ($isSelected ? "#F8F6FB" : "#ffffff")};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? alpha(THEME.brand, 18.82) : "#E5E7EB")};
  box-shadow: ${({ $isSelected }) => ($isSelected ? `0 0 0 2px ${alpha(THEME.brand, 12.55)}` : "0 1px 3px rgba(0, 0, 0, 0.04)")};
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &:hover .card-actions {
    opacity: 1;
  }
`;

const CardActions = styled.div`
  opacity: 0;
  transition: opacity 120ms ease;
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
`;

const DescriptionClamp = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const KindBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  text-transform: capitalize;
`;

function getShortDescription(description, fallback) {
  if (!description) return fallback;
  const firstLine = description.split("\n").find((line) => line.trim() !== "");
  return firstLine?.trim() || fallback;
}

function highlightMatch(text, term) {
  if (!term || !text) return text;
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + term.length);
  const after = text.slice(index + term.length);

  return (
    <>
      {before}
      <mark style={{ backgroundColor: "#FEF3C7", color: "inherit", padding: 0, borderRadius: "2px" }}>{match}</mark>
      {after}
    </>
  );
}

function getMatchingTag(app, term, fallback) {
  if (!term) return null;
  const desc = getShortDescription(app.description, fallback);
  const visibleMatch = [app.name, app.slug, desc].some(
    (text) => text && text.toLowerCase().includes(term.toLowerCase())
  );
  if (visibleMatch) return null;
  const tagName = (t) => (typeof t === "string" ? t : t?.name || t?.title || "");
  return app.tags?.find((t) => tagName(t).toLowerCase().includes(term.toLowerCase())) || null;
}

function AppStoreGridCardComponent({
  app,
  isSelected,
  onSelect,
  onOpenApp,
  onEditApp,
  onPinApp,
  onFavoriteApp,
  onDeleteApp,
  searchTerm,
  getCategoryIcon,
  userOrganizationId,
}) {
  const { storeLabels } = useLaunchpadConfig();
  const labels = storeLabels.card;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuJustClosed, setMenuJustClosed] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isOwnedByUser = app.organization_id === userOrganizationId;

  const rawCategory = app.category || app.manifest?.kind || "utility";
  const category = typeof rawCategory === "string" ? rawCategory : rawCategory?.name || rawCategory?.title || "utility";
  const rawKind = app.manifest?.kind;
  const kind = rawKind ? (typeof rawKind === "string" ? rawKind : rawKind?.name || rawKind?.title || "utility") : null;
  const kindStyle = KIND_STYLES[kind || category] || KIND_STYLES.utility;
  const CategoryIcon = getCategoryIcon(category);
  const tint = getCategoryTint(category);
  const publisherLogoUrl = app.publisher?.logo_url || app.publisher?.profile?.logo_url || null;
  const matchingTagRaw = getMatchingTag(app, searchTerm, labels.noDescription);
  const matchingTag = matchingTagRaw ? (typeof matchingTagRaw === "string" ? matchingTagRaw : matchingTagRaw?.name || matchingTagRaw?.title || "") : null;

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = (e) => {
    if (e) e.stopPropagation();
    setMenuAnchor(null);
    setMenuJustClosed(true);
    setTimeout(() => setMenuJustClosed(false), 200);
  };

  const handleMenuAction = (e, action) => {
    e.stopPropagation();
    setMenuAnchor(null);
    action(app);
  };

  const handleCardClick = () => {
    if (menuJustClosed) return;
    onSelect(app);
  };

  return (
    <>
    <CardWrapper
      $isSelected={isSelected}
      className="d-flex flex-column p-3"
      role="button"
      tabIndex={0}
      data-app-id={app.id}
      onClick={handleCardClick}
      onDoubleClick={() => onOpenApp(app)}
    >
      {/* Top row: icon + actions */}
      <div className="d-flex align-items-start justify-content-between mb-2">
        <IconBox
          className="d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: publisherLogoUrl ? "transparent" : hasSvgAppIcon(app) ? "#FFFFFF" : tint.bg,
            overflow: "hidden",
          }}
        >
          {publisherLogoUrl ? (
            <img
              src={publisherLogoUrl}
              alt={app.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <CatalogAppIconComponent app={app} size={24} fallbackIcon={CategoryIcon} sx={{ color: tint.iconColor }} />
          )}
        </IconBox>

        <CardActions className="card-actions d-flex align-items-center gap-1">
          <Tooltip title={app.is_pinned ? labels.unpin : labels.pin} arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onPinApp(app);
              }}
              sx={{ padding: "4px", color: app.is_pinned ? THEME.brand : "#9CA3AF" }}
            >
              {app.is_pinned ? <PushPinIcon sx={{ fontSize: 16 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={app.is_favorite ? labels.unfavorite : labels.favorite} arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteApp(app);
              }}
              sx={{ padding: "4px", color: app.is_favorite ? "#F59E0B" : "#9CA3AF" }}
            >
              {app.is_favorite ? <StarFilledIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={handleMenuOpen} sx={{ padding: "4px", color: "#9CA3AF" }}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </CardActions>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          // The corner and the shadow are the theme's, like every other menu in
          // the app; this card kept the rounder ones it arrived with.
          PaperProps={{ sx: { minWidth: "160px" } }}
        >
          <MenuItem onClick={(e) => handleMenuAction(e, onOpenApp)} sx={{ fontSize: "13px", gap: 1 }}>
            <OpenInNewIcon sx={{ fontSize: 16, color: "#6B7280" }} />
            {labels.open}
          </MenuItem>
          {isOwnedByUser && (
            <MenuItem onClick={(e) => handleMenuAction(e, onEditApp)} sx={{ fontSize: "13px", gap: 1 }}>
              <EditIcon sx={{ fontSize: 16, color: "#6B7280" }} />
              {labels.editInStudio}
            </MenuItem>
          )}
          {isOwnedByUser && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(null);
                setDeleteConfirmOpen(true);
              }}
              sx={{ fontSize: "13px", gap: 1, color: THEME.danger }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
              {labels.delete}
            </MenuItem>
          )}
        </Menu>
      </div>

      {/* Name + slug */}
      <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {highlightMatch(app.name, searchTerm)}
      </div>
      <div className="mb-1" style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {highlightMatch(app.slug, searchTerm)}
      </div>

      {/* Description */}
      <DescriptionClamp>{highlightMatch(getShortDescription(app.description, labels.noDescription), searchTerm)}</DescriptionClamp>

      {/* Matching tag badge */}
      {matchingTag && (
        <div className="mt-1">
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#92400E",
              backgroundColor: "#FEF3C7",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {highlightMatch(matchingTag, searchTerm)}
          </span>
        </div>
      )}

      {/* Bottom row: publisher + kind */}
      <div className="mt-auto d-flex align-items-center justify-content-between flex-wrap gap-1 pt-2" style={{ minWidth: 0 }}>
        <AppStorePublisherPillComponent publisher={app.publisher} />
        <KindBadge style={{ backgroundColor: kindStyle.bg, color: kindStyle.color }}>
          {kind || category}
        </KindBadge>
      </div>
    </CardWrapper>

    {/* Delete confirmation dialog */}
    <Dialog
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onClick={(e) => e.stopPropagation()}
      PaperProps={{ sx: { borderRadius: "16px", maxWidth: "400px" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "16px", pb: 0.5 }}>{labels.deleteTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: "14px", color: "#4B5563" }}>
          {labels.deleteConfirmBefore}
          <strong>{app.name}</strong>
          {labels.deleteConfirmAfter}
        </DialogContentText>
      </DialogContent>
      <DialogActions component="footer" sx={{ px: 3, pb: 2, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: "none", color: THEME.textSecondary }}>
          {labels.cancel}
        </Button>
        <Button
          onClick={() => {
            setDeleteConfirmOpen(false);
            onDeleteApp(app);
          }}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "8px",
            backgroundColor: THEME.dangerStrong,
            color: "#fff",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#7F0F2E", boxShadow: "none" },
          }}
        >
          {labels.delete}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default AppStoreGridCardComponent;

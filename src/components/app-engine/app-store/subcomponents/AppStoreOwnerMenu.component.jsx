import React, { useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { MoreVert as MoreVertIcon, EditOutlined as EditIcon, DeleteOutline as DeleteIcon } from "@mui/icons-material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { alpha } from "../../defaults/launchpad.theme";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_DIALOG_SX, STORE_ROOT_SX, storePaperSx } from "../app-store.styles";
import AppStorePillComponent from "./AppStorePill.component";

// The menu and the confirmation open in portals, outside the store's root, so they carry its palette.
const MENU_PAPER_SX = { ...STORE_ROOT_SX, ...storePaperSx("12px"), minWidth: 180, border: `1px solid ${COLORS.hairline}`, boxShadow: COLORS.shadowHover };
const MENU_ITEM_SX = { gap: 1, fontSize: 14, color: COLORS.ink, "&:hover, &.Mui-focusVisible": { backgroundColor: COLORS.hover } };

/** For an app the organization owns: edit it in the Studio, or delete it after a confirmation. */
function AppStoreOwnerMenuComponent({ app }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, editApp, deleteApp } = useAppStore();

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [anchor, setAnchor] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const openMenu = (event) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  const onEdit = () => {
    setAnchor(null);
    editApp(app);
  };

  const onAskDelete = () => {
    setAnchor(null);
    setConfirming(true);
  };

  const onConfirmDelete = async () => {
    setDeleting(true);
    await deleteApp(app);
    setDeleting(false);
    setConfirming(false);
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      <Tooltip title={labels.card.moreActions}>
        <IconButton
          size="small"
          onClick={openMenu}
          aria-label={labels.card.moreActions}
          sx={{ color: COLORS.textTertiary, mt: -0.5, mr: -0.5, "&:hover": { color: COLORS.ink, backgroundColor: alpha(COLORS.ink, 6) } }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: MENU_PAPER_SX } }}>
        <MenuItem onClick={onEdit} sx={MENU_ITEM_SX}>
          <EditIcon fontSize="small" sx={{ color: COLORS.textTertiary }} />
          {labels.card.editInStudio}
        </MenuItem>
        <MenuItem onClick={onAskDelete} sx={{ ...MENU_ITEM_SX, color: COLORS.danger }}>
          <DeleteIcon fontSize="small" />
          {labels.card.delete}
        </MenuItem>
      </Menu>

      <Dialog
        open={confirming}
        onClose={() => !deleting && setConfirming(false)}
        sx={STORE_DIALOG_SX}
        slotProps={{ paper: { sx: { ...storePaperSx(), maxWidth: 420 } } }}
      >
        <DialogTitle component="h2" sx={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>
          {labels.card.deleteTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14, lineHeight: 1.5, color: COLORS.textSecondary }}>
            {labels.card.deleteConfirmBefore}
            <strong>{app.name}</strong>
            {labels.card.deleteConfirmAfter}
          </DialogContentText>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 2.5, gap: 1.25 }}>
          <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.medium} onClick={() => setConfirming(false)} disabled={deleting}>
            {labels.card.cancel}
          </AppStorePillComponent>
          <AppStorePillComponent tone={STORE_PILL_TONES.danger} size={STORE_PILL_SIZES.medium} onClick={onConfirmDelete} disabled={deleting}>
            {labels.card.delete}
          </AppStorePillComponent>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AppStoreOwnerMenuComponent;

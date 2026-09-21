import React from "react";
import { useNavigate } from "react-router-dom";
import { Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import {
  FolderOffOutlined as UngroupIcon,
  OpenInNew as NewTabIcon,
  PushPin as PinIcon,
  PushPinOutlined as PinOutlinedIcon,
  LinkOutlined as CopyLinkIcon,
  StorefrontOutlined as StoreIcon,
  LaunchOutlined as OpenIcon,
} from "@mui/icons-material";
import { openSnackbar } from "@link-loom/react-sdk";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME } from "../defaults/launchpad.theme";

// A compact row menu: 30px rows in 13px type, the glyph smaller and lighter than its label.
const MENU_SX = {
  "& .MuiPaper-root": {
    borderRadius: LAUNCHPAD_THEME.radiusMd,
    border: `1px solid ${LAUNCHPAD_THEME.border}`,
    boxShadow: LAUNCHPAD_THEME.shadowMd,
    minWidth: 208,
    overflow: "hidden",
  },
  "& .MuiMenuItem-root": {
    minHeight: 30,
    padding: "4px 8px",
    borderRadius: LAUNCHPAD_THEME.radiusSm,
    fontSize: LAUNCHPAD_THEME.fontSize13,
    lineHeight: 1.4,
    color: LAUNCHPAD_THEME.menuText,
  },
  "& .MuiMenuItem-root .MuiSvgIcon-root": {
    fontSize: 14,
    marginRight: "10px",
    color: LAUNCHPAD_THEME.menuIcon,
  },
  // Full-bleed rules, with the 8px of air MUI gives a divider that follows an item.
  "& .MuiDivider-root": {
    margin: "8px -4px",
  },
};

/**
 * The right-click menu of an app, shared by the rail and the launchpad so the
 * same gesture means the same thing in both.
 *
 * Ways to open it come first, then the pin — the one thing that changes what
 * the rail shows — then the ways to take it somewhere else. A platform of the
 * ecosystem is not an app definition, so it has no store entry.
 */
function AppContextMenuComponent({ entry, anchor, onClose, onOpen, onTogglePin, onRemoveFromGroup, hrefFor }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const navigate = useNavigate();
  const { labels, paths } = useLaunchpadConfig();

  if (!entry) {
    return null;
  }

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const words = labels.menu;
  const isApp = entry.kind === "app";
  const href = hrefFor?.(entry);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const run = (action) => () => {
    onClose?.();
    action();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(href);
      openSnackbar(words.linkCopied, "success");
    } catch {
      openSnackbar(labels.copyBlocked, "warning");
    }
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Menu
      open={Boolean(anchor)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchor ? { top: anchor.y, left: anchor.x } : undefined}
      MenuListProps={{ dense: true }}
      disableScrollLock
      sx={MENU_SX}
    >
      <MenuItem onClick={run(() => onOpen?.(entry))}>
        <ListItemIcon>
          <OpenIcon />
        </ListItemIcon>
        {words.open}
      </MenuItem>

      <MenuItem onClick={run(() => window.open(href, "_blank", "noopener,noreferrer"))}>
        <ListItemIcon>
          <NewTabIcon />
        </ListItemIcon>
        {words.newTab}
      </MenuItem>

      {/* Opened from inside a group, the app can be sent back to the grid. */}
      {entry.groupId && [
        <Divider key="group-divider" component="li" />,
        <MenuItem key="ungroup" onClick={run(() => onRemoveFromGroup?.(entry.groupId, entry.id))}>
          <ListItemIcon>
            <UngroupIcon />
          </ListItemIcon>
          {labels.group.removeFromGroup}
        </MenuItem>,
      ]}

      <Divider component="li" />

      {/* Platforms can leave the rail too. Theirs is a local choice — there is
          no preference record for something that is not an app definition —
          and the StoneOS folder in "My apps" is where they come back from. */}
      <MenuItem onClick={run(() => onTogglePin?.(entry))}>
        <ListItemIcon>{entry.is_pinned ? <PinIcon /> : <PinOutlinedIcon />}</ListItemIcon>
        {entry.is_pinned ? words.unpin : words.pin}
      </MenuItem>

      <Divider component="li" />

      <MenuItem onClick={run(copyLink)}>
        <ListItemIcon>
          <CopyLinkIcon />
        </ListItemIcon>
        {words.copyLink}
      </MenuItem>

      {isApp && (
        <MenuItem onClick={run(() => navigate(`${paths.store}?q=${encodeURIComponent(entry.name)}`))}>
          <ListItemIcon>
            <StoreIcon />
          </ListItemIcon>
          {words.viewInStore}
        </MenuItem>
      )}
    </Menu>
  );
}

export default AppContextMenuComponent;

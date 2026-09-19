import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import {
  ArrowBackOutlined as ArrowBackIcon,
  FolderOutlined as FolderIcon,
  ImageOutlined as ImageIcon,
  InsertDriveFileOutlined as FileIcon,
  SearchOutlined as SearchIcon,
} from "@mui/icons-material";
import { THEME_RADII } from "../defaults/storage.theme";

import { formatFileSize } from "../shared/storage.helpers";

export const FILE_PICKER_LABELS = {
  title: "Choose a file",
  searchPlaceholder: "Search in Files",
  back: "Back",
  empty: "Nothing here",
  noMatches: "No files match your search",
  loadError: "Files could not be loaded",
  cancel: "Cancel",
  select: "Select",
};

const SEARCH_DEBOUNCE_MS = 250;

const matchesAccept = (item, accept) => {
  if (item.kind === "folder" || !accept) {
    return true;
  }
  return String(item.mime_type || "").startsWith(accept);
};

/**
 * Kit-styled picker over the user's Files (`sdk.files.list` / `sdk.files.search`). Folders navigate,
 * files matching `accept` (a MIME prefix such as `image/`) can be selected; `onSelect` receives the
 * storage item; content stores its `id` and renders it through `files.getUrl(id, { recordId })`.
 */
function FilePickerDialog({ open, onClose, onSelect, files, accept, labels }) {
  // Models
  const [folderStack, setFolderStack] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

  // UI states
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const text = { ...FILE_PICKER_LABELS, ...labels };
  const currentFolder = folderStack[folderStack.length - 1] || null;
  const trimmedSearch = searchText.trim();

  const loadItems = async ({ isCurrent }) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const result = trimmedSearch
        ? await files.search(trimmedSearch)
        : await files.list(currentFolder ? { parentId: currentFolder.id } : {});
      if (!isCurrent()) {
        return;
      }
      setItems((result.items || []).filter((item) => matchesAccept(item, accept)));
    } catch {
      if (isCurrent()) {
        setLoadError(text.loadError);
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  };

  const openFolder = (folder) => {
    setSelected(null);
    setSearchText("");
    setFolderStack((stack) => [...stack, folder]);
  };

  const goBack = () => {
    setSelected(null);
    setFolderStack((stack) => stack.slice(0, -1));
  };

  // Content keeps the picked item's `id`; readers mint short-lived URLs with `files.getUrl(id, { recordId })`.
  const selectItem = (item) => {
    if (item) {
      onSelect?.(item);
    }
  };

  const confirmSelection = () => {
    if (selected) {
      selectItem(selected);
    }
  };

  useEffect(() => {
    if (!open) {
      setFolderStack([]);
      setSelected(null);
      setSearchText("");
      return undefined;
    }

    let current = true;
    const timer = setTimeout(() => loadItems({ isCurrent: () => current }), trimmedSearch ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [open, currentFolder?.id, trimmedSearch, accept]);

  const emptyMessage = trimmedSearch ? text.noMatches : text.empty;

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: THEME_RADII.md, fontFamily: "var(--stos-font-ui, inherit)" } }}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 600, color: "var(--stos-text-primary, #1b2233)" }}>{text.title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <TextField
          size="small"
          value={searchText}
          placeholder={text.searchPlaceholder}
          onChange={(event) => setSearchText(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {!trimmedSearch && folderStack.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--stos-text-secondary, #515d72)", fontSize: 13 }}>
            <IconButton size="small" aria-label={text.back} onClick={goBack}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentFolder?.name}</span>
          </div>
        )}

        <div
          style={{
            minHeight: 280,
            maxHeight: 380,
            overflowY: "auto",
            border: "1px solid var(--stos-border, #e4e8ef)",
            borderRadius: THEME_RADII.md,
          }}
        >
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <CircularProgress size={22} />
            </div>
          )}
          {!isLoading && (loadError || !items.length) && (
            <p style={{ margin: 0, padding: 32, textAlign: "center", fontSize: 13, color: "var(--stos-text-tertiary, #737f94)" }}>
              {loadError || emptyMessage}
            </p>
          )}
          {!isLoading && !loadError && items.length > 0 && (
            <List dense disablePadding>
              {items.map((item) => {
                const isFolder = item.kind === "folder";
                const ItemIcon = isFolder ? FolderIcon : String(item.mime_type).startsWith("image/") ? ImageIcon : FileIcon;
                return (
                  <ListItemButton
                    key={item.id}
                    selected={selected?.id === item.id}
                    onClick={() => (isFolder ? openFolder(item) : setSelected(item))}
                    onDoubleClick={() => !isFolder && selectItem(item)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ItemIcon fontSize="small" sx={{ color: "var(--stos-text-secondary, #515d72)" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={isFolder ? null : item.location || formatFileSize(item.size_bytes)}
                      primaryTypographyProps={{ noWrap: true, fontSize: 13 }}
                      secondaryTypographyProps={{ noWrap: true, fontSize: 12 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {text.cancel}
        </Button>
        <Button variant="contained" disableElevation disabled={!selected} onClick={confirmSelection} sx={{ textTransform: "none" }}>
          {text.select}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FilePickerDialog;

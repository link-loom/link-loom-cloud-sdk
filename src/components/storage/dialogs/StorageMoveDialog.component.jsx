import React, { useEffect, useMemo, useState } from "react";
import { Button, Chip, CircularProgress, IconButton, InputAdornment, TextField } from "@mui/material";
import {
  ChevronRightOutlined as ChevronRightIcon,
  DriveFileMoveOutlined as DriveFileMoveIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  FolderOutlined as FolderIcon,
  LockOutlined as LockIcon,
  SearchOutlined as SearchIcon,
} from "@mui/icons-material";

import { buildTree } from "../shared/storage.helpers";
import { THEME_COLORS, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";

/**
 * Accessible complement of drag-to-move. Shows where the item lives now, offers the folder
 * tree (search collapses it to a flat list of matches with their full path), and disables the
 * moved items' own subtree so a folder can never be dropped into itself. Anchored browsers
 * only offer their workload's subtree.
 */
function StorageMoveDialog({
  service,
  organizationId,
  floorId = "",
  items = [],
  currentFolderName = "",
  isBusy = false,
  onSubmit,
  onCancel,
}) {
  const [nodes, setNodes] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState("");
  const [searchText, setSearchText] = useState("");

  const movingIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const loadTree = async () => {
    const response = await service.getByParameters({ queryselector: "tree", search: floorId || organizationId });
    setNodes(response?.success ? response.result || [] : []);
  };

  useEffect(() => {
    loadTree();
  }, [organizationId, floorId]);

  const tree = useMemo(() => buildTree(nodes || []), [nodes]);

  // Full display path per node ("alpha-app / Docs / Inner") for the search results.
  const pathById = useMemo(() => {
    const byId = new Map((nodes || []).map((node) => [node.id, node]));
    const paths = new Map();

    (nodes || []).forEach((node) => {
      const segments = [node.name];
      let cursor = byId.get(node.parent_id);
      while (cursor) {
        segments.unshift(cursor.name);
        cursor = byId.get(cursor.parent_id);
      }
      paths.set(node.id, segments.join(" / "));
    });

    return paths;
  }, [nodes]);

  const isDisabled = (nodeId) => {
    if (movingIds.has(nodeId)) return true;
    const byId = new Map((nodes || []).map((node) => [node.id, node]));
    let cursor = byId.get(nodeId);
    while (cursor) {
      if (movingIds.has(cursor.id)) return true;
      cursor = byId.get(cursor.parent_id);
    }
    return false;
  };

  const toggleExpanded = (nodeId) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const rowStyle = (disabled, isSelected) => ({
    padding: "6px 10px",
    borderRadius: THEME_RADII.md,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    background: isSelected ? tint(THEME_COLORS.brandPrimary, 8) : "transparent",
    transition: "background-color 0.12s ease",
  });

  const renderNode = (node, depth = 0) => {
    const disabled = isDisabled(node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id) || depth === 0;

    return (
      <React.Fragment key={node.id}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setSelectedId(node.id)}
          onKeyDown={(event) => {
            if (!disabled && event.key === "Enter") setSelectedId(node.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            ...rowStyle(disabled, isSelected),
            paddingLeft: 10 + depth * 20,
          }}
        >
          {hasChildren ? (
            <IconButton
              size="small"
              sx={{ padding: "1px" }}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          ) : (
            <span style={{ width: 20 }} />
          )}
          <FolderIcon sx={{ fontSize: 17, color: THEME_COLORS.warning }} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 13,
              color: THEME_COLORS.textBody,
            }}
          >
            {node.name}
          </span>
          {node.rename_locked && <LockIcon sx={{ fontSize: 12, color: THEME_COLORS.textMuted }} />}
        </div>

        {hasChildren && isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  const renderSearchResults = () => {
    const query = searchText.trim().toLowerCase();
    const matches = (nodes || []).filter((node) => node.name.toLowerCase().includes(query));

    if (!matches.length) {
      return (
        <p
          style={{
            fontSize: THEME_TYPE.fontSize12,
            color: THEME_COLORS.textSecondary,
            textAlign: "center",
            margin: "0",
            paddingTop: "1rem",
            paddingBottom: "1rem",
          }}
        >
          No folders match "{searchText}".
        </p>
      );
    }

    return matches.map((node) => {
      const disabled = isDisabled(node.id);
      const isSelected = selectedId === node.id;

      return (
        <div
          key={node.id}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setSelectedId(node.id)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", ...rowStyle(disabled, isSelected) }}
        >
          <FolderIcon sx={{ fontSize: 17, color: THEME_COLORS.warning, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: "0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
                color: THEME_COLORS.textBody,
              }}
            >
              {node.name}
            </p>
            <p
              style={{
                margin: "0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 11,
                color: THEME_COLORS.textMuted,
              }}
            >
              {pathById.get(node.id)}
            </p>
          </div>
        </div>
      );
    });
  };

  const selectionIsCurrentParent = selectedId && items.length > 0 && items.every((item) => item.parent_id === selectedId);

  // The chip names where the item LIVES — for tree-initiated moves that is not the browsed
  // folder, so derive it from the loaded tree and only fall back to the host's hint.
  const currentLocationLabel = pathById.get(items[0]?.parent_id) || currentFolderName;

  return (
    <section style={{ padding: "1rem", width: "min(640px, 92vw)", fontFamily: "var(--stos-font-ui, inherit)", color: THEME_COLORS.textBody }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          paddingRight: 36,
        }}
      >
        <h5 style={{ fontWeight: THEME_TYPE.weightStrong, margin: "0", fontSize: THEME_TYPE.fontSize16, color: THEME_COLORS.textStrong }}>
          Move {items.length === 1 ? `"${items[0]?.name}"` : `${items.length} items`}
        </h5>
        {currentLocationLabel && (
          <Chip
            icon={<FolderIcon sx={{ fontSize: 14 }} />}
            label={`Current: ${currentLocationLabel}`}
            size="small"
            sx={{ height: 24, fontSize: THEME_TYPE.fontSize11, bgcolor: THEME_COLORS.surfaceCard, color: THEME_COLORS.textBodyMuted }}
          />
        )}
      </header>

      <TextField
        fullWidth
        size="small"
        placeholder="Search folders"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16 }} />
            </InputAdornment>
          ),
          sx: { fontSize: 13, height: 34 },
        }}
        sx={{ mb: 2 }}
      />

      <div
        style={{
          borderRadius: THEME_RADII.sm,
          border: `1px solid ${THEME_COLORS.borderMuted}`,
          height: 340,
          overflowY: "auto",
          padding: "6px 6px",
        }}
      >
        {nodes === null ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
            <CircularProgress size={20} />
          </div>
        ) : searchText.trim() ? (
          renderSearchResults()
        ) : tree.length ? (
          tree.map((node) => renderNode(node))
        ) : (
          <p
            style={{
              fontSize: THEME_TYPE.fontSize12,
              color: THEME_COLORS.textSecondary,
              textAlign: "center",
              margin: "0",
              paddingTop: "1rem",
              paddingBottom: "1rem",
            }}
          >
            No folders to move into yet.
          </p>
        )}
      </div>

      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
        <p
          style={{
            margin: "0",
            fontSize: THEME_TYPE.fontSize12,
            color: THEME_COLORS.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "55%",
          }}
        >
          {selectedId ? `Destination: ${pathById.get(selectedId) || ""}` : "Pick a destination folder."}
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={onCancel} sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedId || selectionIsCurrentParent || isBusy}
            onClick={() => onSubmit?.(selectedId)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: THEME_TYPE.fontSize13,
              boxShadow: "none",
              backgroundColor: THEME_COLORS.brandPrimary,
              "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
            }}
          >
            <DriveFileMoveIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Move here
          </Button>
        </div>
      </footer>
    </section>
  );
}

export default StorageMoveDialog;

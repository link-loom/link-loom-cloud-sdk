import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, IconButton, InputBase, TextField, Tooltip, Typography } from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  EditOutlined as EditIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { AppEngineSDKProvider } from "@/features/app-engine/context/AppEngineSDK.context";
import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import useLaunchpadApps from "@/features/app-engine/launchpad/useLaunchpadApps.hook";
import useLaunchpadLayout from "@/features/app-engine/launchpad/useLaunchpadLayout.hook";
import useReorderFlip from "@/features/app-engine/launchpad/useReorderFlip.hook";
import {
  startTileDrag,
  endTileDrag,
  draggedTile,
  resolveDrop,
  sameContainer,
} from "@/features/app-engine/launchpad/launchpadDragAndDrop";
import CatalogAppIconComponent, { hasSvgAppIcon } from "../CatalogAppIcon.component";
import { getCategoryIcon, getCategoryTint } from "../categoryIcon.util";
import { LAUNCHPAD_THEME as THEME } from "../defaults/launchpad.theme";
import AppContextMenuComponent from "./AppContextMenu.component";
import StoneOSTabsComponent from "./StoneOSTabs.component";

const TILE = 58;
const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "8px 12px" };
const PINNED_ZONE = { zone: "pinned" };
const APPS_ZONE = { zone: "apps" };

/** A row lights up while a tile from somewhere else hovers over its space. */
const zoneSx = (active) => ({
  ...GRID,
  borderRadius: "12px",
  outline: active ? `2px dashed ${THEME.brand}` : "2px dashed transparent",
  outlineOffset: "4px",
  transition: "outline-color 120ms ease",
});
const FADE = {
  "@keyframes loomFadeIn": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
  animation: "loomFadeIn 200ms ease",
};

/**
 * The page's own motion and drop hints, scoped to its root.
 *
 * The apps arrive once: each tile scales in from 86% with its opacity, a beat
 * after the one before it (`--i`), and the search settles first with a plain
 * fade. While a tile is dragged, the tile under the pointer says what letting
 * go would do: a frame means the two become a group, a rule down one side
 * means the dragged tile lands there.
 */
const PAGE_SX = {
  "@keyframes loomAppPop": { from: { opacity: 0, transform: "scale(0.86)" }, to: { opacity: 1, transform: "none" } },
  "@keyframes loomAppFade": { from: { opacity: 0, transform: "translateY(-4px)" }, to: { opacity: 1, transform: "none" } },
  "& .loom-app-grid--enter .loom-app-tile": {
    animation: "loomAppPop 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
    animationDelay: "calc(var(--i, 0) * 24ms)",
  },
  "& .loom-app-search--enter": { animation: "loomAppFade 420ms ease both" },
  "@media (prefers-reduced-motion: reduce)": {
    "& .loom-app-grid--enter .loom-app-tile, & .loom-app-search--enter": { animation: "none" },
  },
  "& .loom-app-tile": { position: "relative" },
  "& .loom-app-tile.is-group::after": {
    content: '""',
    position: "absolute",
    inset: "6px",
    borderRadius: "16px",
    border: `2px solid ${THEME.brand}`,
    background: `color-mix(in srgb, ${THEME.brand} 8%, transparent)`,
    pointerEvents: "none",
  },
  "& .loom-app-tile.is-before::before, & .loom-app-tile.is-after::before": {
    content: '""',
    position: "absolute",
    top: "12px",
    bottom: "12px",
    width: "2px",
    borderRadius: "2px",
    background: THEME.brand,
    pointerEvents: "none",
  },
  "& .loom-app-tile.is-before::before": { left: "-2px" },
  "& .loom-app-tile.is-after::before": { right: "-2px" },
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Puts each open panel on the row right under the tile it belongs to.
 *
 * A panel spans every column, so grid placement would otherwise push it to the
 * next line and leave the rest of its tile's row empty. Splicing it after the
 * last tile of that row keeps the row full and the folder directly below it,
 * which is what a folder opening on a phone looks like. Insertions are applied
 * back to front so earlier indices stay valid.
 */
const withOpenPanels = (tiles, panels, columns) => {
  const points = panels
    .filter((entry) => entry && entry.at >= 0)
    .map((entry) => ({ ...entry, row: Math.min((Math.floor(entry.at / columns) + 1) * columns, tiles.length) }))
    .sort((a, b) => b.row - a.row);

  const next = [...tiles];
  points.forEach((point) => next.splice(point.row, 0, point.panel));
  return next;
};

/** A container's identity, for telling drop hints apart. */
const zoneKey = (container) => (container.zone === "group" ? `group:${container.id}` : container.zone);

const categoryOf = (app) => {
  const raw = app.category || app.manifest?.kind || "workspace";
  return typeof raw === "string" ? raw : raw?.name || "workspace";
};

/**
 * The square: an app in its category tint, or a platform in its own colour.
 * `bare` drops the square, its tint and its elevation, leaving just the mark —
 * for chips, where the chip is already the surface and a second one reads as a
 * card inside a card.
 */
function AppGlyph({ entry, size = TILE, bare = false }) {
  if (bare) {
    const category = categoryOf(entry);
    return (
      <Box sx={{ width: size, height: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <CatalogAppIconComponent
          app={entry}
          size={size}
          fallbackIcon={getCategoryIcon(category)}
          sx={{ color: getCategoryTint(category).iconColor }}
        />
      </Box>
    );
  }

  if (entry.kind === "platform") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "26%",
          display: "grid",
          placeItems: "center",
          backgroundColor: `${entry.color}1f`,
          // An app icon should sit on the launchpad, not be printed on it: a
          // hairline of light along the top edge, then a short drop.
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 1px rgba(27,34,51,.06), 0 4px 10px -3px rgba(27,34,51,.22)",
        }}
      >
        <Box
          component="img"
          src={entry.image}
          alt=""
          sx={{ width: size * 0.55, height: size * 0.55, borderRadius: "18%", objectFit: "cover" }}
        />
      </Box>
    );
  }
  const category = categoryOf(entry);
  const tint = getCategoryTint(category);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "26%",
        display: "grid",
        placeItems: "center",
        backgroundColor: hasSvgAppIcon(entry) ? "#FFFFFF" : tint.bg,
        // An app icon should sit on the launchpad, not be printed on it: a
        // hairline of light along the top edge, then a short drop.
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 1px rgba(27,34,51,.06), 0 4px 10px -3px rgba(27,34,51,.22)",
      }}
    >
      <CatalogAppIconComponent
        app={entry}
        size={hasSvgAppIcon(entry) ? size * 0.6 : size * 0.45}
        fallbackIcon={getCategoryIcon(category)}
        sx={{ color: tint.iconColor }}
      />
    </Box>
  );
}

const tileSx = (active) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1.25,
  p: "16px 8px 14px",
  borderRadius: "14px",
  border: 0,
  // Hovering lifts the tile onto a plate of its own, halfway to paper.
  background: active ? THEME.tileHover : "transparent",
  boxShadow: active ? THEME.shadowSm : "none",
  cursor: "pointer",
  textAlign: "center",
  font: "inherit",
  color: "inherit",
  transition: "background-color 140ms ease, box-shadow 140ms ease",
  "&:hover, &:focus-visible": {
    background: THEME.tileHover,
    boxShadow: THEME.shadowSm,
    outline: "none",
  },
});

function AppTile({ entry, onOpen, onContextMenu, index = 0, intent = null, drag }) {
  return (
    <Box
      component="button"
      type="button"
      className={`loom-app-tile${intent ? ` is-${intent}` : ""}`}
      style={{ "--i": index }}
      data-flip-key={entry.id}
      draggable={drag ? true : undefined}
      onDragStart={drag ? (event) => drag.onDragStart(event, entry) : undefined}
      onDragEnd={drag ? drag.onDragEnd : undefined}
      onClick={() => onOpen(entry)}
      onContextMenu={(event) => onContextMenu?.(event, entry)}
      sx={tileSx(false)}
      aria-label={entry.name}
    >
      <AppGlyph entry={entry} />
      <Typography variant="subtitle1" noWrap sx={{ maxWidth: "100%", color: "text.secondary" }}>
        {entry.name}
      </Typography>
    </Box>
  );
}

/** A folder someone made: four of its apps on a square, the way iOS draws it. */
function GroupTile({ group, open, onToggle, onContextMenu, index = 0, intent = null, drag }) {
  return (
    <Box
      component="button"
      type="button"
      className={`loom-app-tile${intent ? ` is-${intent}` : ""}`}
      style={{ "--i": index }}
      data-flip-key={group.id}
      draggable={drag ? true : undefined}
      onDragStart={drag ? (event) => drag.onDragStart(event, group) : undefined}
      onDragEnd={drag ? drag.onDragEnd : undefined}
      onContextMenu={(event) => onContextMenu?.(event, group)}
      onClick={onToggle}
      sx={tileSx(open)}
      aria-expanded={open}
      aria-label={group.name}
    >
      <Box
        sx={{
          width: TILE,
          height: TILE,
          borderRadius: "26%",
          backgroundColor: THEME.bgMuted,
          border: `1px solid ${THEME.border}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          p: "8px",
          boxSizing: "border-box",
        }}
      >
        {group.members.slice(0, 4).map((member) => (
          <Box key={member.id} sx={{ borderRadius: "4px", overflow: "hidden", display: "grid", placeItems: "center" }}>
            <AppGlyph entry={member} size={18} />
          </Box>
        ))}
      </Box>
      <Typography variant="subtitle1" noWrap sx={{ maxWidth: "100%", color: "text.secondary" }}>
        {group.name}
      </Typography>
    </Box>
  );
}

/** The StoneOS folder: four of the platforms' marks on a quiet square. */
function FolderTile({ label, entries, open, onToggle, index = 0 }) {
  return (
    <Box
      component="button"
      type="button"
      className="loom-app-tile"
      style={{ "--i": index }}
      onClick={onToggle}
      sx={tileSx(open)}
      aria-expanded={open}
      aria-label={label}
    >
      <Box
        sx={{
          width: TILE,
          height: TILE,
          borderRadius: "26%",
          backgroundColor: THEME.bgMuted,
          border: `1px solid ${THEME.border}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          p: "8px",
          boxSizing: "border-box",
        }}
      >
        {entries.slice(0, 4).map((entry) => (
          <Box
            key={entry.id}
            sx={{ borderRadius: "4px", backgroundColor: entry.color, display: "grid", placeItems: "center", overflow: "hidden" }}
          >
            <Box
              component="img"
              src={entry.image}
              alt=""
              sx={{ width: "70%", height: "70%", objectFit: "cover", borderRadius: "2px" }}
            />
          </Box>
        ))}
      </Box>
      <Typography variant="subtitle1" noWrap sx={{ maxWidth: "100%", color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

function GetMoreTile({ label, onClick, index = 0 }) {
  return (
    <Box component="button" type="button" className="loom-app-tile" style={{ "--i": index }} onClick={onClick} sx={tileSx(false)}>
      <Box
        sx={{
          width: TILE,
          height: TILE,
          borderRadius: "26%",
          border: `1.5px dashed ${THEME.borderStrong}`,
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
          color: THEME.textTertiary,
        }}
      >
        <AddIcon sx={{ fontSize: 26 }} />
      </Box>
      <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

function SectionLabel({ children, trailing, className, index = 0 }) {
  return (
    <Box
      className={className}
      style={{ "--i": index }}
      sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}
    >
      <Typography variant="overline" sx={{ color: THEME.textTertiary }}>
        {children}
      </Typography>
      {trailing}
    </Box>
  );
}

/** The load-failure state: an icon in a tinted circle, a title and a retry. */
function LaunchpadErrorState({ title, retryLabel, onRetry }) {
  return (
    <Box
      role="alert"
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 0.75, py: 3, px: 2 }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          color: THEME.danger,
          backgroundColor: `color-mix(in srgb, ${THEME.danger} 10%, white)`,
          "& svg": { fontSize: 20 },
        }}
      >
        <ErrorOutlineIcon />
      </Box>
      <Typography variant="h5" component="p" sx={{ mt: 0.5 }}>
        {title}
      </Typography>
      <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry} sx={{ mt: 1 }}>
        {retryLabel}
      </Button>
    </Box>
  );
}

function AppLaunchpadContent({ renderBridge }) {
  const { labels, paths } = useLaunchpadConfig();
  const navigate = useNavigate();
  const { apps, pinned, recent, platforms, isLoading, hasError, launch, togglePin, hrefFor, refresh } = useLaunchpadApps();

  // Models
  const [query, setQuery] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const searchRef = useRef(null);

  // The arrangement of every row: the order of each one, and the folders made
  // by dropping one icon onto another.
  const others = useMemo(() => apps.filter((app) => !app.is_pinned), [apps]);
  const layout = useLaunchpadLayout({ apps: others, pinned });
  const [dropHint, setDropHint] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [justNamed, setJustNamed] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [draftName, setDraftName] = useState("");
  const nameRef = useRef(null);
  const cancelName = useRef(false);

  // A folder opens on the row under its own icon, the way it does on a phone —
  // which means knowing how many columns `auto-fill` resolved to at this width.
  // The panel is then a grid child spanning every column, spliced in after the
  // last tile of that row so the row above it stays full.
  // A callback ref, not `useRef`: the grid does not exist on the first render —
  // the page is still loading — so an effect keyed on nothing would measure a
  // null node once and never again.
  const [gridNode, setGridNode] = useState(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    if (!gridNode || typeof ResizeObserver === "undefined") return undefined;

    const measure = () => {
      const template = window.getComputedStyle(gridNode).gridTemplateColumns;
      setColumns(Math.max(1, template.split(" ").filter(Boolean).length));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridNode);
    return () => observer.disconnect();
  }, [gridNode]);

  // Every row that can be rearranged animates, not just the big grid: a tile
  // that jumps in Pinned or inside an open folder is the same jarring thing.
  const [pinnedNode, setPinnedNode] = useState(null);
  const [folderNode, setFolderNode] = useState(null);
  const openMembers = openGroup ? layout.items.find((item) => item.id === openGroup)?.members || [] : [];

  useReorderFlip(gridNode, layout.items.map((item) => item.id).join("|"));
  useReorderFlip(pinnedNode, layout.pinnedItems.map((item) => item.id).join("|"));
  useReorderFlip(folderNode, openMembers.map((member) => member.id).join("|"));

  /**
   * One drag contract, handed to every tile. What a drop does is decided by
   * the pair of containers involved, not by which row the tile happens to be
   * in, so Pinned, the grid and the inside of a folder all behave alike.
   */
  // A tile only starts the gesture. Where it lands is the container's call —
  // see `resolveDrop` — so the gutters between tiles stop being dead zones.
  const dragFor = (container) => ({
    onDragStart: (event, entry) => {
      startTileDrag(entry, container, event);
      setDropHint(null);
    },
    onDragEnd: () => {
      setDropHint(null);
      endTileDrag();
    },
  });

  const zoneFor = (container) => ({
    onDragOver: (event) => {
      const landing = resolveDrop(event, container, event.currentTarget);
      if (!landing) return;

      // Without this the browser refuses the drop and shows the "no" cursor.
      event.preventDefault();
      // An open folder's grid sits *inside* the apps grid, so without this the
      // outer container answers the same event and the tile is filed twice —
      // into the folder and into the grid behind it.
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setDropHint((current) =>
        current?.target === landing.targetId && current.intent === landing.intent
          ? current
          : { target: landing.targetId, intent: landing.intent, zone: landing.targetId ? undefined : zoneKey(container) }
      );
    },
    // Moving between the container's own children fires `dragleave` too; only
    // actually leaving it should clear the cursor.
    onDragLeave: (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      setDropHint(null);
    },
    onDrop: (event) => {
      event.preventDefault();
      event.stopPropagation();
      const landing = resolveDrop(event, container, event.currentTarget);
      applyDrop({ to: container, targetId: landing?.targetId || null, intent: landing?.intent });
    },
  });

  const applyDrop = ({ to, targetId, intent }) => {
    const drag = draggedTile();
    setDropHint(null);
    endTileDrag();
    if (!drag || !intent) return;

    // Crossing the pin line is a record in Link Loom Cloud, not an
    // arrangement: dragging into Pinned pins, dragging out unpins.
    const crossesPin = (drag.from.zone === "pinned") !== (to.zone === "pinned");
    if (crossesPin) togglePin(drag.entry);

    if (intent === "group" && targetId) {
      const groupId = layout.combine(drag.entry.id, targetId, labels.group.defaultName, drag.from);
      if (groupId) {
        // Straight into naming it, with the folder open — the way a new
        // folder behaves on a phone.
        setFolderOpen(false);
        setOpenGroup(groupId);
        setJustNamed(groupId);
        setEditingName(groupId);
      }
      return;
    }

    if (sameContainer(drag.from, to) && !targetId) return;

    layout.move({
      sourceId: drag.entry.id,
      from: drag.from,
      to,
      targetId,
      side: intent === "append" ? "after" : intent,
    });
  };

  const groupName = useCallback((id) => layout.items.find((item) => item.id === id)?.name || "", [layout.items]);

  const commitName = () => {
    if (!openGroup) return;
    if (cancelName.current) {
      cancelName.current = false;
      setDraftName(groupName(openGroup));
      setEditingName(null);
      return;
    }
    const name = draftName.trim();
    if (!name) {
      setDraftName(groupName(openGroup));
      setEditingName(null);
      return;
    }
    if (name !== groupName(openGroup)) layout.renameGroup(openGroup, name);
    setEditingName(null);
  };

  // One folder open at a time: two panels on screen turn the grid into a
  // stack of drawers and the row-under-the-tile placement stops meaning
  // anything. Opening either one closes the other.
  const toggleGroup = (id) => {
    setFolderOpen(false);
    setOpenGroup((current) => (current === id ? null : id));
  };

  const toggleStoneOS = () => {
    setOpenGroup(null);
    setFolderOpen((value) => !value);
  };

  const startRename = () => {
    if (!openGroup) return;
    setDraftName(groupName(openGroup));
    setJustNamed(openGroup);
    setEditingName(openGroup);
  };

  const openMenu = (event, entry) => {
    event.preventDefault();
    setMenu({ entry, position: { x: event.clientX, y: event.clientY } });
  };

  // The point of a launchpad is to type the moment it opens.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Opening a folder loads its name into the field.
  useEffect(() => {
    if (openGroup) setDraftName(groupName(openGroup));
    else setEditingName(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGroup]);

  // A folder that was just born gets its name preselected, so the first
  // keystroke replaces "Group". This waits for the draft to reach the DOM:
  // selecting before React writes the value collapses the selection.
  useEffect(() => {
    if (!justNamed || justNamed !== openGroup) return;
    const name = groupName(openGroup);
    if (!name || nameRef.current?.value !== name) return;
    nameRef.current.focus();
    nameRef.current.select();
    setJustNamed(null);
  }, [justNamed, openGroup, draftName, groupName]);

  // Taking the last app out dissolves the group; the panel must not stay open
  // over a folder that no longer exists.
  useEffect(() => {
    if (openGroup && !layout.items.some((item) => item.id === openGroup)) {
      setOpenGroup(null);
      setJustNamed(null);
      setEditingName(null);
    }
  }, [layout.items, openGroup]);

  // The apps arrive once — on the first paint that has them. After that the
  // grids sit still; typing and clearing the search must not replay it.
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    if (isLoading || !entering) return undefined;
    const timer = setTimeout(() => setEntering(false), 1200);
    return () => clearTimeout(timer);
  }, [isLoading, entering]);

  // Derived
  const needle = normalize(query.trim());
  const searching = needle.length > 0;

  const matches = useMemo(() => {
    if (!searching) return [];
    const haystack = (entry) => normalize(`${entry.name} ${categoryOf(entry)} ${entry.description || ""} ${entry.tagline || ""}`);
    return [...apps, ...platforms].filter((entry) => haystack(entry).includes(needle));
  }, [searching, needle, apps, platforms]);

  const goStore = (term) => navigate(term ? `${paths.store}?q=${encodeURIComponent(term)}` : paths.store);

  const onSearchKeyDown = (event) => {
    if (event.key === "Escape") setQuery("");
    if (event.key === "Enter" && searching && matches.length === 1) launch(matches[0]);
  };

  // The two folders that can be open, built here and placed by
  // `withOpenPanels` on the row under their own tile.
  const groupPanel = openGroup ? (
    <Box
      key="__group-panel"
      sx={{
        ...FADE,
        gridColumn: "1 / -1",
        mt: 0.5,
        mb: 1.5,
        p: "18px 20px 12px",
        borderRadius: "16px",
        backgroundColor: "background.paper",
        border: `1px solid ${THEME.border}`,
      }}
    >
      {/* The row holds its height so swapping title for field does not
                    make the grid below jump. */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1, minHeight: 40 }}>
        {editingName === openGroup ? (
          <TextField
            inputRef={nameRef}
            label={labels.group.nameLabel}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitName}
            slotProps={{
              // On the input, not the field: TextField spreads stray
              // handlers onto the FormControl root, where the key never
              // reaches the element we need to blur.
              htmlInput: {
                onKeyDown: (event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    cancelName.current = true;
                    event.currentTarget.blur();
                  }
                },
              },
            }}
            sx={{ minWidth: 240 }}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, minWidth: 0 }}>
            <Typography variant="h5" noWrap onClick={startRename} sx={{ cursor: "text" }}>
              {groupName(openGroup)}
            </Typography>
            <Tooltip title={labels.group.rename}>
              <IconButton
                size="small"
                onClick={startRename}
                aria-label={labels.group.rename}
                sx={{ color: THEME.textTertiary }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Tooltip title={labels.folderClose}>
          <IconButton
            size="small"
            onClick={() => setOpenGroup(null)}
            aria-label={labels.folderClose}
            sx={{ color: THEME.textTertiary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box ref={setFolderNode} sx={zoneSx(dropHint?.zone === `group:${openGroup}`)} {...zoneFor({ zone: "group", id: openGroup })}>
        {(layout.items.find((item) => item.id === openGroup)?.members || []).map((member, index) => (
          <AppTile
            key={member.id}
            entry={member}
            onOpen={launch}
            onContextMenu={(event, entry) => openMenu(event, { ...entry, groupId: openGroup })}
            index={index}
            intent={dropHint?.target === member.id ? dropHint.intent : null}
            drag={dragFor({ zone: "group", id: openGroup })}
          />
        ))}
      </Box>
    </Box>
  ) : null;

  const stoneOSPanel = folderOpen ? (
    <Box
      key="__stoneos-panel"
      sx={{
        ...FADE,
        gridColumn: "1 / -1",
        mt: 0.5,
        mb: 1.5,
        p: "18px 20px 12px",
        borderRadius: "16px",
        backgroundColor: "background.paper",
        border: `1px solid ${THEME.border}`,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h5">{labels.folderStoneOS}</Typography>
        <Tooltip title={labels.folderClose}>
          <IconButton
            size="small"
            onClick={() => setFolderOpen(false)}
            aria-label={labels.folderClose}
            sx={{ color: THEME.textTertiary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={GRID}>
        {platforms.map((entry) => (
          <AppTile key={entry.id} entry={entry} onOpen={launch} onContextMenu={openMenu} />
        ))}
      </Box>
    </Box>
  ) : null;

  return (
    <Box sx={{ ...PAGE_SX, display: "flex", flexDirection: "column", minHeight: `calc(100vh - ${THEME.topbarHeight})` }}>
      {renderBridge?.({ apps, pinned, query, setQuery, launch, searchRef })}

      <StoneOSTabsComponent value="apps" />

      <Box sx={{ flex: 1, overflow: "auto", p: { xs: "28px 20px 40px", md: "44px 64px 48px" }, boxSizing: "border-box" }}>
        {/* Search */}
        <Box
          className={entering ? "loom-app-search--enter" : undefined}
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4.5 }}
        >
          {/* The question does the work a page title would, and better: it says
              what the field below it is for instead of naming the screen you
              are already looking at. It sits inside the entrance animation so
              it does not land a beat after the field. */}
          <Typography
            component="h2"
            sx={{
              mb: 2.5,
              textAlign: "center",
              // Not a heading weight: this is an invitation, not a label. At 600
              // and near-black it shouted over the field it introduces, which is
              // the thing the eye should land on. Regular weight in the
              // secondary ink lets it lead and then get out of the way.
              fontSize: { xs: 19, md: 23 },
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: "text.secondary",
            }}
          >
            {labels.prompt}
          </Typography>
          <Box sx={{ width: 580, maxWidth: "100%", position: "relative" }}>
            {/* The field's root is positioned too and comes after this in the DOM, so
                without a z-index its white background paints straight over the
                glyph — present in the tree, invisible on screen. */}
            <SearchIcon
              sx={{
                position: "absolute",
                zIndex: 1,
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                color: THEME.textTertiary,
                pointerEvents: "none",
              }}
            />
            <InputBase
              inputRef={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={labels.searchPlaceholder}
              inputProps={{ "aria-label": labels.searchPlaceholder }}
              sx={{
                width: "100%",
                height: 50,
                pl: "44px",
                pr: "84px",
                borderRadius: "12px",
                border: `1px solid ${THEME.border}`,
                backgroundColor: "background.paper",
                fontSize: 16,
                boxShadow: THEME.shadowSm,
                transition: "border-color 120ms ease, box-shadow 120ms ease",
                "&.Mui-focused": {
                  borderColor: "primary.main",
                  boxShadow: `0 0 0 3px color-mix(in srgb, ${THEME.brand} 15%, transparent)`,
                },
              }}
            />
            {/* One pill, not three keys: it is a single shortcut. */}
            <Box
              component="span"
              sx={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: 11,
                letterSpacing: "0.04em",
                px: "8px",
                py: "4px",
                borderRadius: 999,
                border: `1px solid ${THEME.border}`,
                color: THEME.textTertiary,
                backgroundColor: THEME.bgPage,
              }}
            >
              {labels.searchShortcut}
            </Box>
          </Box>
        </Box>

        {hasError && (
          <LaunchpadErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={refresh} />
        )}

        {/* Everything below the search waits for the apps. Rendering the
            folder and "Get more" on the first, empty paint spent their
            entrance on nothing: when the apps arrived those two kept their
            DOM nodes, so they had no animation left and simply jumped to
            their place in the finished grid. Now the whole thing mounts in
            one paint and enters together. */}
        {!isLoading &&
          (searching ? (
            <Box sx={FADE}>
              <SectionLabel>{labels.results(matches.length)}</SectionLabel>
              <Box sx={GRID}>
                {matches.map((entry) => (
                  <AppTile key={entry.id} entry={entry} onOpen={launch} onContextMenu={openMenu} />
                ))}
              </Box>
              {matches.length === 0 && (
                <Box sx={{ textAlign: "center", pt: 4.5, pb: 1, color: "text.secondary" }}>
                  <Typography variant="body1" sx={{ mb: 1.75, fontSize: 15 }}>
                    {labels.noResults(query.trim())}
                  </Typography>
                  <Button variant="contained" onClick={() => goStore(query.trim())}>
                    {labels.searchStore(query.trim())}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <>
              {recent.length > 0 && (
                <Box sx={{ mb: 4.25 }} className={entering ? "loom-app-grid--enter" : undefined}>
                  {/* Recent sits under the search, centred with it — it is the
                    first thing you reach for, not a section of the grid. */}
                  <Typography
                    variant="overline"
                    className="loom-app-tile"
                    style={{ "--i": 0 }}
                    sx={{ display: "block", textAlign: "center", color: THEME.textTertiary, mb: 1.5 }}
                  >
                    {labels.recent}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, flexWrap: "wrap" }}>
                    {recent.slice(0, 5).map((entry, index) => (
                      <Box
                        key={entry.id}
                        component="button"
                        type="button"
                        className="loom-app-tile"
                        style={{ "--i": index + 1 }}
                        onClick={() => launch(entry)}
                        onContextMenu={(event) => openMenu(event, entry)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: "5px 12px 5px 6px",
                          borderRadius: 999,
                          border: `1px solid ${THEME.border}`,
                          backgroundColor: "background.paper",
                          fontSize: 13,
                          color: "text.primary",
                          cursor: "pointer",
                          font: "inherit",
                          "&:hover": { borderColor: THEME.borderStrong, backgroundColor: THEME.bgPage },
                        }}
                      >
                        <AppGlyph entry={entry} size={18} bare />
                        {entry.name}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {layout.pinnedItems.length > 0 && (
                <Box sx={{ mb: 4.5 }} className={entering ? "loom-app-grid--enter" : undefined}>
                  <SectionLabel className="loom-app-tile" index={0}>
                    {labels.pinned}
                  </SectionLabel>
                  <Box ref={setPinnedNode} sx={zoneSx(dropHint?.zone === "pinned")} {...zoneFor(PINNED_ZONE)}>
                    {layout.pinnedItems.map((entry, index) => (
                      <AppTile
                        key={entry.id}
                        entry={entry}
                        onOpen={launch}
                        onContextMenu={openMenu}
                        index={index}
                        intent={dropHint?.target === entry.id ? dropHint.intent : null}
                        drag={dragFor(PINNED_ZONE)}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box className={entering ? "loom-app-grid--enter" : undefined}>
                <SectionLabel className="loom-app-tile" index={0}>
                  {labels.allApps}
                </SectionLabel>
                {/* Drag a tile between two others to reorder; drop it on one to
                  make a folder; drop it on the open space to bring it here out
                  of a folder or out of Pinned. `dropHint` is what the target is
                  told it would become, so the frame appears before the mouse is
                  released. */}
                <Box ref={setGridNode} sx={zoneSx(dropHint?.zone === "apps")} {...zoneFor(APPS_ZONE)}>
                  {withOpenPanels(
                    [
                      ...layout.items.map((item, index) =>
                        item.kind === "group" ? (
                          <GroupTile
                            key={item.id}
                            group={item}
                            open={openGroup === item.id}
                            onToggle={() => toggleGroup(item.id)}
                            onContextMenu={openMenu}
                            index={index + 1}
                            intent={dropHint?.target === item.id ? dropHint.intent : null}
                            drag={dragFor(APPS_ZONE)}
                          />
                        ) : (
                          <AppTile
                            key={item.id}
                            entry={item}
                            onOpen={launch}
                            onContextMenu={openMenu}
                            index={index + 1}
                            intent={dropHint?.target === item.id ? dropHint.intent : null}
                            drag={dragFor(APPS_ZONE)}
                          />
                        )
                      ),
                      <FolderTile
                        key="__stoneos"
                        label={labels.folderStoneOS}
                        entries={platforms}
                        open={folderOpen}
                        onToggle={toggleStoneOS}
                        index={layout.items.length + 1}
                      />,
                      <GetMoreTile
                        key="__more"
                        label={labels.getMore}
                        onClick={() => goStore()}
                        index={layout.items.length + 2}
                      />,
                    ],
                    [
                      openGroup ? { at: layout.items.findIndex((item) => item.id === openGroup), panel: groupPanel } : null,
                      folderOpen ? { at: layout.items.length, panel: stoneOSPanel } : null,
                    ],
                    columns
                  )}
                </Box>
              </Box>

              {apps.length === 0 && !hasError && (
                <Typography variant="body2" sx={{ color: THEME.textTertiary, mt: 2 }}>
                  {labels.emptyHint}
                </Typography>
              )}
            </>
          ))}
      </Box>

      <AppContextMenuComponent
        entry={menu?.entry}
        anchor={menu?.position}
        onClose={() => setMenu(null)}
        onOpen={launch}
        onTogglePin={togglePin}
        onRemoveFromGroup={layout.removeFromGroup}
        hrefFor={hrefFor}
      />
    </Box>
  );
}

/**
 * "My apps" — the launchpad of the operating system, not a table of records.
 *
 * Search first, the last things opened, what is pinned, then everything else;
 * the platforms live in one folder so a person with nothing installed still
 * has the whole ecosystem a click away, and the last tile is the door to the
 * App Store. Typing narrows to what matches; no match hands the search to the
 * store.
 *
 * `renderBridge(state)` lets the host mount its own context bridge (the
 * Sommatic Command Center, for instance) with `{ apps, pinned, query, setQuery,
 * launch, searchRef }`; it should render nothing visible.
 */
function AppLaunchpadComponent({ baseUrl, renderBridge }) {
  return (
    <AppEngineSDKProvider baseUrl={baseUrl}>
      <AppLaunchpadContent renderBridge={renderBridge} />
    </AppEngineSDKProvider>
  );
}

export default AppLaunchpadComponent;

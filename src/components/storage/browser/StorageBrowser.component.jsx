import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  ListItemIcon,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  AccessTimeOutlined as RecentIcon,
  AccountTreeOutlined as AccountTreeIcon,
  AppsOutlined as WorkloadIcon,
  AssignmentOutlined as ProjectIcon,
  ArrowUpwardOutlined as ArrowUpwardIcon,
  AudioFileOutlined as AudioFileIcon,
  ChevronRightOutlined as ChevronRightIcon,
  CloseOutlined as CloseIcon,
  CloudUploadOutlined as CloudUploadIcon,
  ContentCopyOutlined as ContentCopyIcon,
  CreateNewFolderOutlined as CreateNewFolderIcon,
  DeleteOutlined as DeleteIcon,
  DeleteForeverOutlined as DeleteForeverIcon,
  DownloadOutlined as DownloadIcon,
  DriveFileMoveOutlined as DriveFileMoveIcon,
  DriveFileRenameOutlineOutlined as RenameIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  FolderOutlined as FolderIcon,
  GridViewOutlined as GridViewIcon,
  ImageOutlined as ImageIcon,
  InfoOutlined as InfoIcon,
  InsertDriveFileOutlined as InsertDriveFileIcon,
  Inventory2Outlined as TrashboxIcon,
  KeyboardOutlined as KeyboardIcon,
  IosShareOutlined as IosShareIcon,
  LockOutlined as LockIcon,
  MovieOutlined as MovieIcon,
  OpenInNewOutlined as OpenInNewIcon,
  PeopleAltOutlined as SharedWithMeIcon,
  PictureAsPdfOutlined as PictureAsPdfIcon,
  RefreshOutlined as RefreshIcon,
  RestoreFromTrashOutlined as RestoreFromTrashIcon,
  SearchOutlined as SearchIcon,
  UploadOutlined as UploadIcon,
  ViewListOutlined as ViewListIcon,
} from "@mui/icons-material";
import { DataGrid, PopUp, openSnackbar } from "@link-loom/react-sdk";
import { ListItemText } from "@mui/material";

import { buildTree, formatFileSize, mimeFamily, triggerFileDownload } from "../shared/storage.helpers";
import { selectionCapabilities, storageCapabilities } from "../shared/storage.capabilities";
import { THEME_COLORS, THEME_MOTION, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";
import { STORAGE_BROWSER_LABELS } from "../defaults/storage.labels";
import { STORAGE_HELP } from "../defaults/storage.help";
import StorageNameDialog from "../dialogs/StorageNameDialog.component";
import StorageMoveDialog from "../dialogs/StorageMoveDialog.component";
import StorageShareDialog from "../dialogs/StorageShareDialog.component";
import StorageDeleteDialog from "../dialogs/StorageDeleteDialog.component";
import StorageShortcutsDialog from "../dialogs/StorageShortcutsDialog.component";
import StorageObjectPreview from "../preview/StorageObjectPreview.component";
import StorageUploadQueue from "../upload/StorageUploadQueue.component";
import { IS_MAC, SHORTCUTS, hasCommandModifier, isTypingTarget } from "../defaults/storage.shortcuts";
import ShortcutKeys from "../shared/ShortcutKeys.component";

const VIEW_MODE_STORAGE_KEY = "llc-storage-view-mode";
const INTERNAL_DRAG_TYPE = "application/x-storage-object-id";

const FAMILY_ICONS = {
  image: ImageIcon,
  video: MovieIcon,
  audio: AudioFileIcon,
  pdf: PictureAsPdfIcon,
  file: InsertDriveFileIcon,
};

// Views a host can route to. `recent` and `shared` exist only for the user scope.
export const STORAGE_VIEWS = { files: "", trash: "trash", recent: "recent", shared: "shared" };

// Flat views list items from anywhere in the scope instead of one folder's children. "Shared with
// me" is flat because it has to be: a grantee cannot read the folders a shared file sits in, so
// this listing IS the synthetic root above those files.
const FLAT_VIEW_SELECTORS = { trash: "trash", recent: "recent", shared: "shared-with-me" };

// `trash` answers a plain list, `recent` a page.
const flatListItems = (result) => (Array.isArray(result) ? result : result?.items || []);

// A locked root always belongs to something: the chip and the "open its owner" menu entry both
// read from here, so a project's space never claims to be a workload's.
const ROOT_OWNERS = [
  { key: "workload_id", type: "workload", label: "Workload", Icon: WorkloadIcon, action: "Open workload" },
  { key: "project_id", type: "project", label: "Project", Icon: ProjectIcon, action: "Open project" },
];

const rootOwnerOf = (item) => ROOT_OWNERS.find((owner) => item?.[owner.key]) || null;

// General access only — what everyone else can do. Who a file is named to is a separate axis
// and is shown in the share dialog, not in this column.
const VISIBILITY_LABELS = {
  public: "Public",
  authenticated: "Expiring link",
  private: "Private",
};

// Motion vocabulary for the whole browser: skeleton pulse, drop overlay entrance, icon bounce,
// selection-bar slide, tile hover lift, tree-panel slide. One <style> tag, class-scoped.
// Motion vocabulary: micro-interactions only. Hover changes the border, never the position or a
// shadow; nothing loops; everything is 120ms and stops entirely under `prefers-reduced-motion`.
const BROWSER_STYLES = `
.storage-tile,
.storage-row-surface { transition: border-color ${THEME_MOTION.fast} ${THEME_MOTION.easing}, background-color ${THEME_MOTION.fast} ${THEME_MOTION.easing}; }
.storage-tile:hover { border-color: ${THEME_COLORS.borderStrong}; background-color: ${THEME_COLORS.hover}; }
.storage-drop-target { border-color: ${THEME_COLORS.brandPrimary} !important; background-color: ${THEME_COLORS.selected} !important; }
.storage-skeleton { background-color: ${THEME_COLORS.surfaceTrack}; }
.storage-tree-panel { transition: width ${THEME_MOTION.fast} ${THEME_MOTION.easing}; overflow: hidden; }
.storage-body { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
.storage-selection-hint { display: none; }
@media (min-width: 768px) {
  .storage-body { flex-direction: row; }
  .storage-selection-hint { display: inline; }
}
/* The browser is embedded at whatever width the host gives it, which is rarely the window's, so
   its own box is the thing to ask. Six labelled verbs do not fit a phone-width column: the labels
   go and the icons stay, because every action — Delete most of all — must remain one tap away and
   visible rather than hidden behind an overflow menu. */
.storage-selection-slot { container-type: inline-size; container-name: storagebar; }
@container storagebar (max-width: 800px) {
  .storage-selection-bar .storage-verb-label { display: none; }
  .storage-selection-bar .MuiButton-root { min-width: 34px; padding-left: 6px; padding-right: 6px; }
}
/* Phone width: the clear button gives way so the count stays readable. Clicking the selected item
   again clears it — the same gesture that selected it. */
@container storagebar (max-width: 420px) {
  .storage-selection-bar .storage-clear-selection { display: none; }
  .storage-selection-bar .MuiButton-root { min-width: 30px; padding-left: 3px; padding-right: 3px; }
}
.storage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; align-items: stretch; }
@media (max-width: 767.98px) {
  .storage-tree-panel.storage-tree-open { width: 100% !important; border-right: none !important; }
  .storage-tree-panel.storage-tree-open > div { width: 100% !important; max-height: 190px !important; border-bottom: 1px solid ${THEME_COLORS.borderMuted}; padding-bottom: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .storage-tile,
  .storage-row-surface,
  .storage-tree-panel { transition: none; }
}
`;

const formatDate = (value) => {
  if (!value) return "--";
  const stamp = !Number.isNaN(Number(value)) ? Number(value) : new Date(value).getTime();
  if (Number.isNaN(stamp)) return "--";
  return new Date(stamp).toLocaleDateString();
};

const CUSTOM_ACTION_PREFIX = "item-action:";

// Image tiles of private objects cannot use the canonical file URL (it needs identity headers an
// <img> cannot send), so they load through a short-lived share-token URL minted by the service
// (cached per object) once the tile nears the viewport. A failed load keeps the type icon.
const THUMBNAIL_ROOT_MARGIN = "200px";

function StorageImageThumbnail({ service, item, fallback }) {
  const [source, setSource] = useState("");
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (isNearViewport || !node) {
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: THUMBNAIL_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNearViewport]);

  useEffect(() => {
    if (!isNearViewport) {
      return undefined;
    }

    let isCurrent = true;
    setHasFailed(false);
    service
      .getFileUrl(item.id, { filename: item.name, visibility: item.access?.visibility })
      .then((url) => isCurrent && setSource(url || ""))
      .catch(() => isCurrent && setSource(""));
    return () => {
      isCurrent = false;
    };
  }, [isNearViewport, item.id, item.access?.visibility]);

  return (
    <span ref={containerRef} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {source && !hasFailed ? (
        <img
          src={source}
          alt={item.name}
          loading="lazy"
          draggable={false}
          onError={() => setHasFailed(true)}
          style={{ maxHeight: 48, maxWidth: 72, objectFit: "cover", borderRadius: THEME_RADII.sm }}
        />
      ) : (
        fallback
      )}
    </span>
  );
}

const itemIcon = (item, size = 40) => {
  if (item.kind === "folder") {
    return <FolderIcon sx={{ fontSize: size, color: THEME_COLORS.warning }} />;
  }

  const FamilyIcon = FAMILY_ICONS[mimeFamily(item.mime_type)] || InsertDriveFileIcon;
  return <FamilyIcon sx={{ fontSize: size, color: THEME_COLORS.brandPrimary }} />;
};

/**
 * The Finder-style file manager.
 *
 * Scopes:
 * - `operator` (api-key console): standalone (whole organization, roots first) or embedded
 *   anchored to one workload's root — the anchored mode floors the breadcrumb at the workload
 *   root and never shows sibling storages; that per-workload cut is also what usage/pricing
 *   reports on.
 * - `user` (identity headers): anchored at the principal's `Files` folder (`user-root`), without
 *   operator affordances; uploads and folders land in the `user-files` space; adds a Recent view.
 *
 * Routing is owned by the host through `routing`: `path` is the folder path relative to the floor
 * ("Archive/Invoices", segments URI-encoded), `view` one of STORAGE_VIEWS, `folderId` an optional
 * legacy id link, `onNavigatePath(path, { view, replace })` moves, `onViewChange(view)` switches
 * views in place, `buildPathUrl(path)` makes a shareable folder address and `onOpenOwner({ type, id })`
 * opens the workload or project that owns a root (operator only).
 *
 * Interaction model (Drive-informed): single click selects and raises the action bar; double
 * click opens (folders navigate, files preview — one verb, no separate "preview"); right
 * click on an item is its menu, right click on empty space is the creation menu. Delete is a
 * single action that opens the trash-or-forever dialog; the trash view restores.
 *
 * `onSelectionChange(selectedItems)` reports the current selection to the embedder so a host can
 * build a picking surface on this browser instead of a second, simpler one. It is a report, not a
 * control: the browser still owns the selection.
 *
 * `chooser` turns the browser into the body of a file-choosing screen. The task is "find these
 * files and hand them back", so everything that finds stays — folders, breadcrumb, search, the
 * view toggle, the folder panel, refresh and double-click to preview — and everything that
 * *changes* storage goes: upload and drop-to-upload, New folder, rename, move, delete, drag to
 * move, the trash and the other flat views, and the destructive keyboard shortcuts. The selection
 * bar goes too: in this mode the host's footer is the only place an action lives, so a second
 * "Share" button inside the body would just be the same decision offered twice.
 */
function StorageBrowser({
  scope = "operator",
  services,
  routing = {},
  labels,
  organizationId,
  workloadId = "",
  workloadSlug = "",
  embedded = false,
  itemActions,
  onOpenItem,
  onSelectionChange,
  viewerIdentity = "",
  chooser = false,
}) {
  const service = services?.storage;
  const text = { ...STORAGE_BROWSER_LABELS, ...labels };
  const isUserScope = scope === "user";
  const isAnchored = isUserScope || embedded;

  // Models
  const [anchorRootId, setAnchorRootId] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [items, setItems] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState(() => window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) || "grid");
  const [searchText, setSearchText] = useState("");
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [expandedTreeIds, setExpandedTreeIds] = useState(() => new Set());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [activeModal, setActiveModal] = useState(null);
  const [modalTarget, setModalTarget] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [creationMenu, setCreationMenu] = useState(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dropFolderId, setDropFolderId] = useState("");
  const [uploadBatch, setUploadBatch] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  // Keyboard cursor: `cursorId` is the item the arrows move from, `anchorId` the fixed end of
  // a shift-extended range. Both follow the mouse too, so switching hands never loses the spot.
  const [cursorId, setCursorId] = useState("");
  const [anchorId, setAnchorId] = useState("");
  const [previewWithInfo, setPreviewWithInfo] = useState(false);
  const [deleteStartsOnPurge, setDeleteStartsOnPurge] = useState(false);
  const fetchIdRef = useRef(0);
  const dragDepthRef = useRef(0);
  const uploadInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const gridRef = useRef(null);
  const browserRootRef = useRef(null);
  const keyHandlerRef = useRef(() => {});

  // The host's address carries the folder PATH, not an id. Ids still work through
  // `routing.folderId` so links shared before paths existed keep resolving — they are rewritten
  // to the readable form once the folder loads.
  const rawPath = routing.path || "";
  const legacyFolderId = routing.folderId || "";
  const currentView = routing.view || STORAGE_VIEWS.files;
  // A chooser only ever shows the file area: the trash, recent and shared views answer a
  // different question and are unreachable from here.
  const isTrashView = !chooser && currentView === STORAGE_VIEWS.trash;
  const isRecentView = !chooser && isUserScope && currentView === STORAGE_VIEWS.recent;
  const isSharedView = !chooser && isUserScope && currentView === STORAGE_VIEWS.shared;
  const isFlatView = isTrashView || isRecentView || isSharedView;
  // Everything in "Shared with me" belongs to somebody else: it can be opened, downloaded and
  // linked, but never renamed, moved, deleted or re-shared. The backend refuses all of those —
  // this keeps the browser from offering an action that can only fail.
  const canMutate = !isTrashView && !isSharedView && !chooser;

  const customActionsFor = (item) => {
    if (isTrashView || typeof itemActions !== "function" || !item) {
      return [];
    }
    return (itemActions(item) || []).filter((customAction) => customAction?.id && customAction?.label);
  };
  // User uploads and folders always land in the principal's Files space.
  const spaceField = isUserScope ? { space: "user-files" } : {};

  const segments = useMemo(
    () =>
      rawPath
        .split("/")
        .map((segment) => {
          try {
            return decodeURIComponent(segment).trim();
          } catch {
            return segment.trim();
          }
        })
        .filter(Boolean),
    [rawPath],
  );

  const segmentsKey = segments.join("/");
  const atRootsView = !isAnchored && !segments.length && !legacyFolderId && !isFlatView;
  const selectedItems = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);
  // What is legal for everything currently selected. Shared with `FileCollection` in the hosts, so
  // a file offers the same verbs wherever it is drawn.
  const selectionCan = useMemo(
    () => selectionCapabilities(selectedItems, { viewerIdentity }),
    [selectedItems, viewerIdentity],
  );

  // The selection is the browser's own state, but a host that embeds it as a picking surface has
  // to read it to act on it (Drive's pick mode confirms several files in one pass). Read-only: the
  // browser keeps owning what is selected.
  const selectionListenerRef = useRef(onSelectionChange);
  selectionListenerRef.current = onSelectionChange;
  useEffect(() => {
    if (typeof selectionListenerRef.current !== "function") {
      return;
    }
    selectionListenerRef.current(selectedItems);
  }, [selectedItems]);

  const visibleItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const list = query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items;
    return [...list].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));
  }, [items, searchText]);

  // Dropping the selection also drops the keyboard cursor and its range anchor — a tile still
  // wearing the cursor ring after the user clicked away reads as "this is selected" when
  // nothing is.
  const clearSelection = () => {
    setSelectedIds((previous) => (previous.size ? new Set() : previous));
    setCursorId("");
    setAnchorId("");
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const encodePath = (list) => list.map((segment) => encodeURIComponent(segment)).join("/");

  /**
   * Every move through the tree is a navigation the host turns into its address, so refreshing
   * or pasting it lands on the same folder.
   */
  const goToSegments = (nextSegments, { replace = false, view = STORAGE_VIEWS.files } = {}) => {
    clearSelection();
    setSearchText("");
    routing.onNavigatePath?.(encodePath(nextSegments), { view, replace });
  };

  // A folder opened from the current listing simply extends the path with its name.
  const openChildFolder = (item) => goToSegments([...segments, item.name]);

  const switchView = (view) => {
    clearSelection();
    setSearchText("");

    if (routing.onViewChange) {
      routing.onViewChange(view);
      return;
    }

    routing.onNavigatePath?.(encodePath(segments), { view, replace: false });
  };

  const openTrash = () => switchView(STORAGE_VIEWS.trash);

  const closeTrash = () => switchView(STORAGE_VIEWS.files);

  const goUp = () => {
    if (isFlatView) {
      closeTrash();
      return;
    }

    if (!segments.length) return;
    goToSegments(segments.slice(0, -1));
  };

  // ── Data loading ────────────────────────────────────────────────────────
  const ensureAnchor = async () => {
    if (!isAnchored) return "";
    if (anchorRootId) return anchorRootId;

    // The principal's own Files folder: the backend provisions it on first use.
    if (isUserScope) {
      const userRootResponse = await service.getByParameters({ queryselector: "user-root" });

      if (!userRootResponse?.success || !userRootResponse.result?.id) {
        throw new Error(userRootResponse?.message || "Your files could not be opened");
      }

      setAnchorRootId(userRootResponse.result.id);
      return userRootResponse.result.id;
    }

    const rootResponse = await service.getByParameters({ queryselector: "workload", search: workloadId });

    if (rootResponse?.success && rootResponse.result?.id) {
      setAnchorRootId(rootResponse.result.id);
      return rootResponse.result.id;
    }

    // First visit: the workload has no storage yet — provision its root now (idempotent).
    const provisioned = await service.provisionWorkloadRoot({ workload_id: workloadId, workload_slug: workloadSlug });

    if (provisioned?.success && provisioned.result?.id) {
      setAnchorRootId(provisioned.result.id);
      return provisioned.result.id;
    }

    throw new Error(provisioned?.message || "The workload storage could not be provisioned");
  };

  // `anchor` travels as an argument: on the very first embedded load the state value is
  // still empty when this runs.
  const loadTree = async (anchor = "") => {
    const treeScope = isAnchored ? anchor || anchorRootId : organizationId;
    if (!treeScope) return;

    const response = await service.getByParameters({ queryselector: "tree", search: treeScope });
    if (response?.success) {
      setTreeNodes(response.result || []);
    }
  };

  const initializeComponent = async () => {
    const myFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setLoadError("");

    try {
      if (isFlatView) {
        const flatResponse = await service.getByParameters({
          queryselector: FLAT_VIEW_SELECTORS[currentView],
          ...(embedded && !isUserScope ? { workload_id: workloadId } : {}),
        });
        if (myFetchId !== fetchIdRef.current) return;

        if (!flatResponse?.success) throw new Error(flatResponse?.message);
        setCurrentFolder(null);
        setBreadcrumb([]);
        setItems(flatListItems(flatResponse.result));

        // The folder panel stays useful inside the flat views (it navigates back out) — keep it
        // fresh here too.
        if (isAnchored) {
          const anchor = await ensureAnchor();
          loadTree(anchor);
        } else {
          loadTree();
        }

        setIsLoading(false);
        return;
      }

      const anchor = await ensureAnchor();

      // The URL names a path; turn it into the folder it points at. An id from a legacy link
      // still wins, and gets rewritten to the readable form once we know its names.
      let folderId = legacyFolderId;

      if (!folderId && segments.length) {
        const resolved = await service.getByParameters({
          queryselector: "path",
          search: encodePath(segments),
          ...(embedded && !isUserScope ? { workload_id: workloadId } : {}),
        });
        if (myFetchId !== fetchIdRef.current) return;

        if (!resolved?.success) {
          setIsLoading(false);
          setLoadError(resolved?.message || `"${segments.join("/")}" does not exist any more.`);
          return;
        }

        folderId = resolved.result.id;
      }

      if (!folderId) {
        folderId = anchor;
      }

      if (!folderId) {
        // Standalone roots view: every storage of the organization.
        const rootsResponse = await service.getByParameters({ queryselector: "roots", search: organizationId });
        if (myFetchId !== fetchIdRef.current) return;

        if (!rootsResponse?.success) throw new Error(rootsResponse?.message);
        setCurrentFolder(null);
        setBreadcrumb([]);
        setItems(rootsResponse.result || []);
      } else {
        const [childrenResponse, breadcrumbResponse] = await Promise.all([
          service.getByParameters({ queryselector: "parent", search: folderId }),
          service.getByParameters({ queryselector: "breadcrumb", search: folderId }),
        ]);
        if (myFetchId !== fetchIdRef.current) return;

        if (!childrenResponse?.success) throw new Error(childrenResponse?.message);
        setCurrentFolder(childrenResponse.result.folder);
        setItems(childrenResponse.result.items || []);

        const chain = breadcrumbResponse?.success ? breadcrumbResponse.result || [] : [];
        const floorIndex = isAnchored ? chain.findIndex((node) => node.id === anchor) : 0;

        // Anchored mode: a link that does not sit under the floor (deep link from another
        // storage, stale URL) must not open a foreign folder here — snap back.
        if (isAnchored && floorIndex < 0 && folderId !== anchor) {
          goToSegments([], { replace: true });
          return;
        }

        const chainFromFloor = floorIndex >= 0 ? chain.slice(floorIndex) : chain;
        setBreadcrumb(chainFromFloor);

        // Legacy id link, or a path whose names drifted (a rename upstream): put the address
        // back in sync with where we actually are, without adding a history entry.
        const canonicalSegments = (isAnchored ? chainFromFloor.slice(1) : chainFromFloor).map((node) => node.name);

        if (canonicalSegments.join("/") !== segments.join("/")) {
          goToSegments(canonicalSegments, { replace: true });
        }
      }

      loadTree(anchor);
      setIsLoading(false);
    } catch (error) {
      if (myFetchId !== fetchIdRef.current) return;
      setIsLoading(false);
      setLoadError(error?.message || "The storage could not be loaded.");
    }
  };

  useEffect(() => {
    if (!service || (!organizationId && !isUserScope)) return;
    initializeComponent();
  }, [organizationId, workloadId, scope, segmentsKey, legacyFolderId, currentView]);

  // ── Commands ────────────────────────────────────────────────────────────
  const refresh = () => initializeComponent();

  const closeModals = () => {
    setActiveModal(null);
    setModalTarget(null);
    setPreviewWithInfo(false);
    setDeleteStartsOnPurge(false);
  };

  const runCommand = async (commandPromise, successMessage) => {
    setIsBusy(true);
    const response = await commandPromise;
    setIsBusy(false);

    if (!response?.success) {
      openSnackbar(response?.message || "The action could not be completed.", "error");
      return null;
    }

    if (successMessage) openSnackbar(successMessage, "success");
    closeModals();
    refresh();
    return response;
  };

  const createFolder = (name) => {
    const destination = currentFolder
      ? { parent_id: currentFolder.id }
      : embedded && !isUserScope
      ? { workload_id: workloadId, workload_slug: workloadSlug }
      : {};
    return runCommand(service.createFolder({ name, ...destination, ...spaceField }), "Folder created.");
  };

  const renameItem = async (item, name) => {
    const response = await runCommand(service.move({ id: item.id, name }), "Renamed.");

    if (!response) return response;

    // Renaming a folder the address names — the current one or an ancestor — would leave the
    // URL pointing at a name nobody answers to; rewrite that segment in place.
    const renamedIndex = breadcrumb.findIndex((node) => node.id === item.id);

    if (renamedIndex >= 0) {
      const segmentIndex = isAnchored ? renamedIndex - 1 : renamedIndex;

      if (segmentIndex >= 0) {
        const nextSegments = [...segments];
        nextSegments[segmentIndex] = name;
        goToSegments(nextSegments, { replace: true });
      }
    }

    return response;
  };

  // Sequential per-item command runner shared by move/trash/purge/restore: stops on the first
  // failure with the item's name in the message, then refreshes whatever did happen.
  const runBatch = async ({ targets, run, successMessage }) => {
    if (isBusy) return false;
    setIsBusy(true);

    for (const target of targets) {
      const response = await run(target);

      if (!response?.success) {
        setIsBusy(false);
        openSnackbar(`"${target.name}": ${response?.message || "the action failed"}`, "error");
        closeModals();
        refresh();
        return false;
      }
    }

    setIsBusy(false);
    clearSelection();
    closeModals();
    openSnackbar(successMessage, "success");
    refresh();
    return true;
  };

  const moveItems = (targets, destinationFolderId) => {
    return runBatch({
      targets,
      run: (target) => service.move({ id: target.id, parent_id: destinationFolderId }),
      successMessage: targets.length === 1 ? "Moved." : `${targets.length} items moved.`,
    });
  };

  // When a batch takes down the folder we are standing in (or one of its ancestors — only the
  // tree menu can reach those), stay would mean browsing a ghost: step out to the nearest
  // surviving parent.
  const escapeIfCurrentFolderAffected = (targets) => {
    if (!currentFolder) return;

    const affected = targets.find(
      (target) => target.id === currentFolder.id || (currentFolder.ancestor_ids || []).includes(target.id),
    );

    if (!affected) return;

    // Walk out to the affected folder's parent path; the browsed folder is always the tail of
    // the breadcrumb, so its ancestors are exactly the segments before it.
    const affectedIndex = breadcrumb.findIndex((node) => node.id === affected.id);
    const keep = affectedIndex >= 0 ? (isAnchored ? affectedIndex - 1 : affectedIndex) : 0;

    goToSegments(segments.slice(0, Math.max(keep, 0)));
  };

  const trashItems = (targets) => {
    const deletable = targets.filter((item) => !(item.is_root && item.rename_locked));

    if (!deletable.length) {
      openSnackbar(STORAGE_HELP.workloadRoot, "warning");
      closeModals();
      return;
    }

    return runBatch({
      targets: deletable,
      run: (target) => service.delete({ id: target.id, recursive: true }),
      successMessage: deletable.length === 1 ? "Moved to trash." : `${deletable.length} items moved to trash.`,
    }).then((ok) => {
      if (ok) escapeIfCurrentFolderAffected(deletable);
      return ok;
    });
  };

  const purgeItems = (targets) => {
    return runBatch({
      targets,
      run: (target) => service.purge({ id: target.id, recursive: true }),
      successMessage: "Permanently deleted.",
    }).then((ok) => {
      if (ok) escapeIfCurrentFolderAffected(targets);
      return ok;
    });
  };

  const restoreItems = (targets) => {
    return runBatch({
      targets,
      run: (target) => service.restore({ id: target.id }),
      successMessage: targets.length === 1 ? "Restored." : `${targets.length} items restored.`,
    });
  };

  const openDeleteDialog = (targets, { startOnPurge = false } = {}) => {
    const list = (Array.isArray(targets) ? targets : [targets]).filter((item) => !(item.is_root && item.rename_locked));

    if (!list.length) {
      openSnackbar(STORAGE_HELP.workloadRoot, "warning");
      return;
    }

    // Set together with the dialog it belongs to: arming it before the guard above left the
    // flag behind when nothing opened, and the next delete started on the permanent step.
    setDeleteStartsOnPurge(startOnPurge);
    setModalTarget(list);
    setActiveModal("delete");
  };

  // A folder's address is its path, so the copied link reads like the place it opens. Hosts
  // without addressable folders get the path itself.
  const folderUrl = (item) => {
    const fromTree = treeNodes.some((node) => node.id === item.id) ? segmentsForTreeNode(item.id) : null;
    const target = encodePath(fromTree?.length ? fromTree : [...segments, item.name]);

    return routing.buildPathUrl ? routing.buildPathUrl(target) : target;
  };

  const copyItemLink = (item) => {
    if (item.kind === "folder") {
      navigator.clipboard.writeText(folderUrl(item));
      openSnackbar("Folder link copied!", "success");
      return;
    }

    if (item.access?.visibility !== "public") {
      setModalTarget(item);
      setActiveModal("share");
      return;
    }

    navigator.clipboard.writeText(service.fileUrl(item.id, { filename: item.name }));
    openSnackbar("Link copied!", "success");
  };

  const downloadItem = async (item) => {
    if (item.kind === "folder") return;

    if (item.access?.visibility === "public") {
      triggerFileDownload(service.fileUrl(item.id, { filename: item.name, download: true }), item.name);
      return;
    }

    const response = await service.shareToken({ id: item.id, ttl_minutes: 15 });

    if (!response?.success || !response.result?.token) {
      openSnackbar(response?.message || "The download link could not be created.", "error");
      return;
    }

    triggerFileDownload(service.fileUrl(item.id, { filename: item.name, token: response.result.token, download: true }), item.name);
  };

  const startUpload = (files, destinationFolder) => {
    if (!files.length) return;

    const folder = destinationFolder || currentFolder;
    if (!folder) {
      openSnackbar("Open a storage first, then upload into it.", "warning");
      return;
    }

    setUploadBatch({ key: Date.now(), files: [...files], destination: { parent_id: folder.id, ...spaceField } });
  };

  // ── Item interaction ────────────────────────────────────────────────────
  const openItem = (item) => {
    if (isTrashView) {
      openSnackbar("This item is in the trash — restore it to open it.", "warning");
      return;
    }

    if (item.kind === "folder") {
      openChildFolder(item);
      return;
    }

    // Hosts (Drive) route files to their own viewer; anything else previews in the browser's panel.
    if (typeof onOpenItem === "function") {
      onOpenItem(item);
      return;
    }
    setModalTarget(item);
    setActiveModal("preview");
  };

  const selectItem = (item, event) => {
    event.stopPropagation();
    setCursorId(item.id);
    setAnchorId(item.id);
    setSelectedIds((previous) => {
      const next = event.ctrlKey || event.metaKey ? new Set(previous) : new Set();
      if ((event.ctrlKey || event.metaKey) && next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const itemOnAction = (action, item) => {
    setContextMenu(null);
    setCreationMenu(null);

    switch (action) {
      case "open":
        openItem(item);
        break;
      case "download":
        if (item.kind === "folder") {
          openSnackbar("Folders are not downloadable — open one and download its files.", "warning");
          return;
        }
        downloadItem(item);
        break;
      case "copy-id":
        navigator.clipboard.writeText(item.id);
        openSnackbar("Id copied!", "success");
        break;
      case "copy-link":
        copyItemLink(item);
        break;
      case "new-tab":
        if (item.kind === "folder" && !routing.buildPathUrl) {
          openItem(item);
        } else if (item.kind === "folder") {
          window.open(folderUrl(item), "_blank", "noopener,noreferrer");
        } else {
          openItem(item);
        }
        break;
      case "share":
        if (item.kind === "folder") {
          openSnackbar("Folders do not have links — share the files inside them.", "warning");
          return;
        }
        setModalTarget(item);
        setActiveModal("share");
        break;
      case "rename":
        if (item.rename_locked) {
          openSnackbar(STORAGE_HELP.workloadRoot, "warning");
          return;
        }
        setModalTarget(item);
        setActiveModal("rename");
        break;
      case "move":
        setModalTarget([item]);
        setActiveModal("move");
        break;
      case "delete":
        openDeleteDialog([item]);
        break;
      case "restore":
        if (isBusy) return;
        restoreItems([item]);
        break;
      default:
        customActionsFor(item)
          .find((customAction) => `${CUSTOM_ACTION_PREFIX}${customAction.id}` === action)
          ?.onClick?.(item);
        break;
    }
  };

  // ── Keyboard ────────────────────────────────────────────────────────────
  // How many tiles fit per row: read straight off the CSS grid so it stays correct at every
  // width, with the tree panel open, and inside the workload workspace.
  const gridColumnCount = () => {
    if (viewMode === "list" || !gridRef.current) return 1;
    const template = window.getComputedStyle(gridRef.current).gridTemplateColumns;
    return Math.max(1, template.split(" ").filter(Boolean).length);
  };

  // What the arrows may walk over: every visible item in the grid, but in list view only the
  // rows the DataGrid actually rendered — its other pages are neither visible nor
  // scrollable-to, and landing the cursor there would arm Delete on rows nobody can see.
  const navigableItems = () => {
    if (viewMode !== "list" || !browserRootRef.current) {
      return visibleItems;
    }

    const renderedIds = new Set(
      [...browserRootRef.current.querySelectorAll(".MuiDataGrid-row[data-id]")].map((row) => row.getAttribute("data-id")),
    );
    const rendered = visibleItems.filter((item) => renderedIds.has(item.id));

    return rendered.length ? rendered : visibleItems;
  };

  const focusItemElement = (itemId) => {
    window.requestAnimationFrame(() => {
      const element =
        document.querySelector(`[data-storage-tile="${itemId}"]`) ||
        browserRootRef.current?.querySelector(`.MuiDataGrid-row[data-id="${itemId}"]`);
      if (!element) return;

      // Move the real focus with the cursor: the browser's own ring then lands on the same
      // tile our ring marks, instead of staying behind on whatever was clicked first.
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "nearest" });
    });
  };

  const moveCursor = (delta, extendSelection) => {
    const walkable = navigableItems();
    if (!walkable.length) return;

    const currentIndex = walkable.findIndex((item) => item.id === cursorId);
    const nextIndex = currentIndex < 0 ? 0 : Math.min(Math.max(currentIndex + delta, 0), walkable.length - 1);
    const nextItem = walkable[nextIndex];

    setCursorId(nextItem.id);

    if (!extendSelection) {
      setAnchorId(nextItem.id);
      setSelectedIds(new Set([nextItem.id]));
      focusItemElement(nextItem.id);
      return;
    }

    // Shift keeps the anchor put and paints the range between it and the cursor.
    const anchorIndex = Math.max(
      walkable.findIndex((item) => item.id === anchorId),
      0,
    );
    const [from, to] = anchorIndex <= nextIndex ? [anchorIndex, nextIndex] : [nextIndex, anchorIndex];
    setSelectedIds(new Set(walkable.slice(from, to + 1).map((item) => item.id)));
    focusItemElement(nextItem.id);
  };

  // The item a single-target shortcut acts on: the cursor when it is part of the selection,
  // otherwise the lone selected item.
  const activeItem = () => {
    if (selectedItems.length === 1) return selectedItems[0];
    return selectedItems.find((item) => item.id === cursorId) || null;
  };

  const openDetails = (item) => {
    if (item.kind !== "file") {
      openSnackbar("Details are available for files.", "warning");
      return;
    }

    setPreviewWithInfo(true);
    setModalTarget(item);
    setActiveModal("preview");
  };

  const onKeyDown = (event) => {
    // Never steal keystrokes from a field, a dialog, or an open menu.
    if (isTypingTarget(event.target) || activeModal || contextMenu || creationMenu) return;

    const withCommand = hasCommandModifier(event);
    const single = activeItem();

    // Navigation ──────────────────────────────────────────────────────────
    if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if ((withCommand || event.altKey) && event.key === "ArrowUp") {
        event.preventDefault();
        goUp();
        return;
      }

      if (withCommand && event.key === "ArrowDown") {
        event.preventDefault();
        if (single) openItem(single);
        return;
      }

      if (event.altKey || withCommand) return;

      event.preventDefault();
      const columns = gridColumnCount();
      const deltas = { ArrowUp: -columns, ArrowDown: columns, ArrowLeft: -1, ArrowRight: 1 };
      moveCursor(deltas[event.key], event.shiftKey);
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      if (!single) return;
      event.preventDefault();

      // Alt+Enter is Explorer's Properties — the same thing ⌘I opens on a Mac.
      if (event.altKey && event.key === "Enter") {
        openDetails(single);
        return;
      }

      openItem(single);
      return;
    }

    if (event.key === "Escape") {
      clearSelection();
      document.activeElement?.blur?.();
      return;
    }

    if (withCommand && event.key.toLowerCase() === "a") {
      event.preventDefault();
      setSelectedIds(new Set(navigableItems().map((item) => item.id)));
      return;
    }

    if (withCommand && event.key.toLowerCase() === "f") {
      event.preventDefault();
      searchInputRef.current?.focus();
      return;
    }

    // Selection actions ───────────────────────────────────────────────────
    if (event.key === "Backspace" || event.key === "Delete") {
      if (!selectedItems.length || isSharedView || chooser) return;
      event.preventDefault();

      if (isTrashView) {
        // Put back: ⌘⌫ on a Mac (Finder), and Ctrl+Z is handled below for Explorer.
        if (IS_MAC && withCommand && !event.altKey) restoreItems(selectedItems);
        else openDeleteDialog(selectedItems);
        return;
      }

      // Permanent: ⌥⌘⌫ (Finder) or Shift+Del (Explorer). Everything else trashes.
      openDeleteDialog(selectedItems, { startOnPurge: (withCommand && event.altKey) || event.shiftKey });
      return;
    }

    // Explorer's undo puts trashed items back.
    if (!IS_MAC && withCommand && event.key.toLowerCase() === "z") {
      if (!isTrashView || !selectedItems.length) return;
      event.preventDefault();
      restoreItems(selectedItems);
      return;
    }

    if (withCommand && (event.altKey || event.shiftKey) && event.key.toLowerCase() === "c") {
      if (!single || chooser) return;
      event.preventDefault();
      copyItemLink(single);
      return;
    }

    if (withCommand && event.key.toLowerCase() === "i") {
      if (!single) return;
      event.preventDefault();
      openDetails(single);
      return;
    }

    // Bare letters — free here because this surface has no type-ahead, and the Finder combos
    // these stand in for are owned by the browser (⌘1/⌘2 switch tabs, ⇧⌘N opens incognito).
    if (withCommand || event.altKey || event.ctrlKey) return;

    switch (event.key.toLowerCase()) {
      case "f2":
        break;
      case "m": {
        if (!selectedItems.length || !canMutate) return;
        event.preventDefault();

        const movable = selectedItems.filter((item) => !item.is_root);

        if (!movable.length) {
          openSnackbar("Storage roots stay where they are.", "warning");
          return;
        }

        setModalTarget(movable);
        setActiveModal("move");
        return;
      }
      case "s":
        if (!single || isTrashView || chooser) return;
        event.preventDefault();
        itemOnAction("share", single);
        return;
      case "d":
        if (!single || isTrashView) return;
        event.preventDefault();
        itemOnAction("download", single);
        return;
      case "n":
        if (isFlatView || !canMutate) return;
        event.preventDefault();
        setModalTarget(null);
        setActiveModal(atRootsView ? "new-root" : "new-folder");
        return;
      case "u":
        if (isFlatView || atRootsView || !canMutate) return;
        event.preventDefault();
        uploadInputRef.current?.click();
        return;
      case "t":
        if (chooser) return;
        event.preventDefault();
        if (isTrashView) closeTrash();
        else openTrash();
        return;
      case "r":
        event.preventDefault();
        refresh();
        return;
      case "1":
        event.preventDefault();
        setViewMode("grid");
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "grid");
        return;
      case "2":
        event.preventDefault();
        setViewMode("list");
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "list");
        return;
      case "?":
        event.preventDefault();
        setActiveModal("shortcuts");
        return;
      default:
        break;
    }

    if (event.key === "F2") {
      if (!single || !canMutate) return;
      event.preventDefault();
      itemOnAction("rename", single);
    }
  };

  // Registered once on the window so shortcuts work before anything has been clicked; the ref
  // keeps the handler fresh without re-subscribing on every render.
  keyHandlerRef.current = onKeyDown;

  useEffect(() => {
    const listener = (event) => keyHandlerRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Clicking away drops the selection: it belongs to this surface, and leaving it lit while the
  // user works elsewhere makes the action bar lie about what a command would hit. The app
  // chrome is exempt (navigating away already ends the story), and so are the overlays this
  // browser opens — a click inside a dialog or menu is still a click on the selection.
  const KEEPS_SELECTION_SELECTORS = [
    // App chrome — navigating away already ends the story.
    ".left-side-menu",
    ".navbar-custom",
    ".footer",
    "header",
    // Overlays this browser opens: a click in a menu or dialog IS a click on the selection.
    ".MuiPopover-root",
    ".MuiModal-root",
    ".MuiSnackbar-root",
    ".MuiTooltip-popper",
    // Interactive surfaces inside the browser.
    "[data-storage-tile]",
    "[data-storage-chrome]",
    ".MuiDataGrid-root",
    ".MuiInputBase-root",
    ".storage-selection-bar",
    ".storage-tree-panel",
    ".MuiButtonBase-root",
    "button",
    "a",
    "input",
    '[role="button"]',
  ].join(", ");

  useEffect(() => {
    const onDocumentPointerDown = (event) => {
      if (!event.target?.closest) {
        return;
      }

      // A scrollbar drag reports the document as its target; it is not a click on the canvas.
      const { clientWidth, clientHeight } = document.documentElement;
      if (event.clientX > clientWidth || event.clientY > clientHeight) {
        return;
      }

      if (event.target.closest(KEEPS_SELECTION_SELECTORS)) {
        return;
      }

      clearSelection();
    };

    document.addEventListener("mousedown", onDocumentPointerDown);
    return () => document.removeEventListener("mousedown", onDocumentPointerDown);
  }, []);

  // ── Drag & drop ─────────────────────────────────────────────────────────
  const onAreaDragEnter = (event) => {
    if (isFlatView || !canMutate || ![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropActive(true);
  };

  const onAreaDragLeave = (event) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDropActive(false);
      setDropFolderId("");
    }
  };

  const onAreaDrop = (event) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDropActive(false);
    setDropFolderId("");

    if (isFlatView || !canMutate) return;

    const files = [...(event.dataTransfer.files || [])];
    if (files.length) startUpload(files, null);
  };

  const folderDropHandlers = (folder) => {
    if (isTrashView || !canMutate) return {};

    return {
      onDragOver: (event) => {
        const types = [...event.dataTransfer.types];
        if (types.includes("Files") || types.includes(INTERNAL_DRAG_TYPE)) {
          event.preventDefault();
          event.stopPropagation();
          setDropFolderId(folder.id);
        }
      },
      onDragLeave: () => setDropFolderId((previous) => (previous === folder.id ? "" : previous)),
      onDrop: (event) => {
        event.preventDefault();
        event.stopPropagation();
        dragDepthRef.current = 0;
        setIsDropActive(false);
        setDropFolderId("");

        const draggedId = event.dataTransfer.getData(INTERNAL_DRAG_TYPE);
        if (draggedId) {
          const dragged = items.filter((item) => selectedIds.has(item.id) || item.id === draggedId);
          const targets = (dragged.length ? dragged : items.filter((item) => item.id === draggedId)).filter(
            (item) => item.id !== folder.id && !item.is_root,
          );
          if (targets.length) moveItems(targets, folder.id);
          return;
        }

        const files = [...(event.dataTransfer.files || [])];
        if (files.length) startUpload(files, folder);
      },
    };
  };

  const itemDragHandlers = (item) => ({
    draggable: !item.is_root && !isTrashView && canMutate,
    onDragStart: (event) => {
      // Finder semantics: dragging an item that is not part of the selection replaces the
      // selection with just that item — otherwise a stale multi-selection would move along.
      setSelectedIds((previous) => (previous.has(item.id) ? previous : new Set([item.id])));
      event.dataTransfer.setData(INTERNAL_DRAG_TYPE, item.id);
      event.dataTransfer.effectAllowed = "move";
    },
  });

  // ── Subviews ────────────────────────────────────────────────────────────
  const renderBreadcrumb = () => (
    <Breadcrumbs
      separator={<ChevronRightIcon sx={{ fontSize: 14 }} />}
      sx={{ fontSize: THEME_TYPE.fontSize12, "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
    >
      {!isAnchored && (
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => (isTrashView ? closeTrash() : goToSegments([]))}
          sx={{ fontSize: THEME_TYPE.fontSize12, fontWeight: currentFolder || isTrashView ? 400 : 600 }}
        >
          {text.storage}
        </MuiLink>
      )}
      {isFlatView ? (
        <span
          style={{
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            color: THEME_COLORS.textStrong,
            fontSize: THEME_TYPE.fontSize12,
          }}
        >
          {isRecentView && <RecentIcon sx={{ fontSize: 13 }} />}
          {isSharedView && <SharedWithMeIcon sx={{ fontSize: 13 }} />}
          {isTrashView && <TrashboxIcon sx={{ fontSize: 13 }} />}
          {isRecentView ? text.recent : isSharedView ? text.sharedWithMe : text.trashbox}
        </span>
      ) : (
        breadcrumb.map((node, index) => {
          const isLast = index === breadcrumb.length - 1;
          return isLast ? (
            <span key={node.id} style={{ fontWeight: THEME_TYPE.weightStrong, color: THEME_COLORS.textStrong, fontSize: THEME_TYPE.fontSize12 }}>
              {node.name}
            </span>
          ) : (
            <MuiLink
              key={node.id}
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => goToSegments(segments.slice(0, isAnchored ? index : index + 1))}
              sx={{ fontSize: THEME_TYPE.fontSize12 }}
              {...folderDropHandlers(node)}
            >
              {node.name}
            </MuiLink>
          );
        })
      )}
    </Breadcrumbs>
  );

  const renderToolbar = () => (
    <section
      data-storage-chrome
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginBottom: "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap", minWidth: 0 }}>
        <Tooltip title={text.upOneLevel}>
          <span>
            <IconButton
              size="small"
              onClick={goUp}
              disabled={atRootsView || (!isFlatView && isAnchored && currentFolder?.id === anchorRootId)}
            >
              <ArrowUpwardIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={text.folderPanel}>
          <IconButton
            size="small"
            onClick={() => setIsTreeOpen((previous) => !previous)}
            sx={{ color: isTreeOpen ? THEME_COLORS.brandPrimary : undefined }}
          >
            <AccountTreeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        {renderBreadcrumb()}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder={
            isTrashView ? text.searchTrashbox : isRecentView ? text.searchRecent : isSharedView ? text.searchShared : text.searchHere
          }
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          inputRef={searchInputRef}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
            sx: { fontSize: THEME_TYPE.fontSize13, height: 32 },
          }}
          sx={{ width: 180 }}
        />

        <div style={{ display: "flex", border: `1px solid ${THEME_COLORS.borderMuted}`, borderRadius: THEME_RADII.md }}>
          <IconButton
            size="small"
            onClick={() => {
              setViewMode("grid");
              window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "grid");
            }}
            sx={{ color: viewMode === "grid" ? THEME_COLORS.brandPrimary : THEME_COLORS.textMuted, borderRadius: `${THEME_RADII.sm} 0 0 ${THEME_RADII.sm}` }}
          >
            <GridViewIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setViewMode("list");
              window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, "list");
            }}
            sx={{ color: viewMode === "list" ? THEME_COLORS.brandPrimary : THEME_COLORS.textMuted, borderRadius: `0 ${THEME_RADII.sm} ${THEME_RADII.sm} 0` }}
          >
            <ViewListIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </div>

        <Tooltip title={text.refresh}>
          <IconButton size="small" onClick={refresh}>
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {!chooser && (
          <Tooltip title={isTrashView ? text.backToFiles : text.trashboxTooltip}>
            <IconButton
              size="small"
              onClick={() => (isTrashView ? closeTrash() : openTrash())}
              sx={{
                color: isTrashView ? THEME_COLORS.errorDark : THEME_COLORS.textMuted,
                background: isTrashView ? tint(THEME_COLORS.error, 8) : "transparent",
              }}
            >
              <TrashboxIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {!isFlatView && canMutate && (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setModalTarget(null);
                setActiveModal(atRootsView ? "new-root" : "new-folder");
              }}
              sx={{ textTransform: "none", fontWeight: THEME_TYPE.weightStrong, fontSize: THEME_TYPE.fontSize13, height: 32 }}
            >
              <CreateNewFolderIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {atRootsView ? text.newStorage : text.newFolder}
            </Button>

            {!atRootsView && (
              <Button
                variant="contained"
                onClick={() => uploadInputRef.current?.click()}
                sx={{
                  textTransform: "none",
                  fontWeight: THEME_TYPE.weightStrong,
                  fontSize: THEME_TYPE.fontSize13,
                  height: 32,
                  boxShadow: "none",
                  backgroundColor: THEME_COLORS.brandPrimary,
                  "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
                }}
              >
                <UploadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                {text.upload}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );

  // A tree node can sit anywhere, so its path is rebuilt from the loaded tree. In anchored
  // mode the workload root is the floor and never appears in the address.
  const segmentsForTreeNode = (nodeId) => {
    const byId = new Map(treeNodes.map((node) => [node.id, node]));
    const chain = [];
    let cursor = byId.get(nodeId);

    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parent_id ? byId.get(cursor.parent_id) : null;
    }

    const relevant = isAnchored ? chain.filter((node) => node.id !== anchorRootId) : chain;
    return relevant.map((node) => node.name);
  };

  const openTreeNode = (nodeId) => goToSegments(segmentsForTreeNode(nodeId));

  const renderTreePanel = () => {
    const tree = buildTree(treeNodes);

    const renderNode = (node, depth = 0) => {
      const isExpanded = expandedTreeIds.has(node.id) || depth === 0;
      const isCurrent = !isFlatView && node.id === (currentFolder?.id || "");

      return (
        <React.Fragment key={node.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => openTreeNode(node.id)}
            onKeyDown={(event) => event.key === "Enter" && openTreeNode(node.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();

              // Tree nodes are always LIVE folders (the tree selector excludes deleted). In the
              // Trashbox the item menu would show trash actions — Delete forever would purge a
              // live folder — so there the tree only navigates.
              if (isFlatView) return;

              setSelectedIds(new Set());
              setContextMenu({ item: node, mouseX: event.clientX, mouseY: event.clientY });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              borderRadius: THEME_RADII.sm,
              padding: "3px 6px",
              paddingLeft: 6 + depth * 14,
              cursor: "pointer",
              fontSize: THEME_TYPE.fontSize12,
              color: isCurrent ? THEME_COLORS.brandPrimary : THEME_COLORS.textBody,
              fontWeight: isCurrent ? 600 : 400,
              background: isCurrent ? tint(THEME_COLORS.brandPrimary, 8) : "transparent",
              transition: "background-color 0.12s ease",
            }}
            {...folderDropHandlers(node)}
          >
            {node.children.length ? (
              <IconButton
                size="small"
                sx={{ padding: "1px" }}
                onClick={(event) => {
                  event.stopPropagation();
                  setExpandedTreeIds((previous) => {
                    const next = new Set(previous);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                }}
              >
                {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            ) : (
              <span style={{ width: 18 }} />
            )}
            <FolderIcon sx={{ fontSize: 15, color: THEME_COLORS.warning }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
            {node.rename_locked && <LockIcon sx={{ fontSize: 11, color: THEME_COLORS.textMuted }} />}
          </div>
          {node.children.length > 0 && isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
        </React.Fragment>
      );
    };

    return (
      <aside
        className={`storage-tree-panel ${isTreeOpen ? "storage-tree-open" : ""}`}
        style={{
          flexShrink: 0,
          width: isTreeOpen ? 230 : 0,
          opacity: isTreeOpen ? 1 : 0,
          borderRight: isTreeOpen ? `1px solid ${THEME_COLORS.surfaceTrack}` : "none",
          // Collapsed it must claim no height either, or the folder list keeps stretching the
          // card with an empty column nobody can see.
          maxHeight: isTreeOpen ? "70vh" : 0,
        }}
      >
        <div style={{ paddingRight: "1rem", width: 230, overflowY: "auto", maxHeight: "70vh" }}>
          <h6
            style={{
              color: THEME_COLORS.textSecondary,
              marginBottom: "0.5rem",
              fontSize: THEME_TYPE.fontSize11,
              fontWeight: THEME_TYPE.weightStrong,
            }}
          >
            {text.folders}
          </h6>
          {tree.length ? (
            tree.map((node) => renderNode(node))
          ) : (
            <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, margin: "0" }}>{text.noFolders}</p>
          )}

          {!chooser && <Divider sx={{ my: 1.5 }} />}
          {!chooser && isUserScope && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchView(isRecentView ? STORAGE_VIEWS.files : STORAGE_VIEWS.recent)}
              onKeyDown={(event) => event.key === "Enter" && switchView(STORAGE_VIEWS.recent)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                borderRadius: THEME_RADII.sm,
                marginBottom: "0.25rem",
                padding: "3px 6px",
                cursor: "pointer",
                fontSize: THEME_TYPE.fontSize12,
                color: isRecentView ? THEME_COLORS.brandPrimary : THEME_COLORS.textBody,
                fontWeight: isRecentView ? 600 : 400,
                background: isRecentView ? tint(THEME_COLORS.brandPrimary, 8) : "transparent",
              }}
            >
              <span style={{ width: 18 }} />
              <RecentIcon sx={{ fontSize: 15, color: isRecentView ? THEME_COLORS.brandPrimary : THEME_COLORS.textMuted }} />
              <span>{text.recent}</span>
            </div>
          )}
          {!chooser && isUserScope && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => switchView(isSharedView ? STORAGE_VIEWS.files : STORAGE_VIEWS.shared)}
              onKeyDown={(event) => event.key === "Enter" && switchView(STORAGE_VIEWS.shared)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                borderRadius: THEME_RADII.sm,
                marginBottom: "0.25rem",
                padding: "3px 6px",
                cursor: "pointer",
                fontSize: THEME_TYPE.fontSize12,
                color: isSharedView ? THEME_COLORS.brandPrimary : THEME_COLORS.textBody,
                fontWeight: isSharedView ? 600 : 400,
                background: isSharedView ? tint(THEME_COLORS.brandPrimary, 8) : "transparent",
              }}
            >
              <span style={{ width: 18 }} />
              <SharedWithMeIcon sx={{ fontSize: 15, color: isSharedView ? THEME_COLORS.brandPrimary : THEME_COLORS.textMuted }} />
              <span>{text.sharedWithMe}</span>
            </div>
          )}
          {!chooser && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => (isTrashView ? closeTrash() : openTrash())}
            onKeyDown={(event) => event.key === "Enter" && openTrash()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              borderRadius: THEME_RADII.sm,
              padding: "3px 6px",
              cursor: "pointer",
              fontSize: THEME_TYPE.fontSize12,
              color: isTrashView ? THEME_COLORS.errorDark : THEME_COLORS.textBody,
              fontWeight: isTrashView ? 600 : 400,
              background: isTrashView ? tint(THEME_COLORS.error, 8) : "transparent",
            }}
          >
            <span style={{ width: 18 }} />
            <TrashboxIcon sx={{ fontSize: 15, color: isTrashView ? THEME_COLORS.errorDark : THEME_COLORS.textMuted }} />
            <span>{text.trashbox}</span>
          </div>
          )}
        </div>
      </aside>
    );
  };

  const renderSkeleton = () => {
    if (viewMode === "list") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="storage-skeleton"
              style={{ height: 36, borderRadius: THEME_RADII.md, background: THEME_COLORS.surfaceTrack }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="storage-grid" style={{ width: "100%" }}>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="storage-skeleton"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1rem",
              borderRadius: THEME_RADII.md,
              border: `1px solid ${THEME_COLORS.borderMuted}`,
            }}
          >
            <div
              style={{ marginBottom: "0.5rem", width: 44, height: 44, borderRadius: THEME_RADII.md, background: THEME_COLORS.surfaceTrack }}
            />
            <div style={{ width: "70%", height: 10, borderRadius: THEME_RADII.xs, background: THEME_COLORS.surfaceTrack }} />
            <div
              style={{ marginTop: "0.25rem", width: "40%", height: 8, borderRadius: THEME_RADII.xs, background: THEME_COLORS.surfaceTrack }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (isFlatView) {
      const FlatIcon = isRecentView ? RecentIcon : isSharedView ? SharedWithMeIcon : TrashboxIcon;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "3rem",
            paddingBottom: "3rem",
            textAlign: "center",
            width: "100%",
          }}
        >
          <FlatIcon sx={{ fontSize: 52, color: THEME_COLORS.textMuted }} />
          <p
            style={{ marginBottom: "0.25rem", marginTop: "0.5rem", fontWeight: THEME_TYPE.weightStrong, fontSize: THEME_TYPE.fontSize14, color: THEME_COLORS.textBody }}
          >
            {isRecentView ? text.recentEmptyTitle : isSharedView ? text.sharedEmptyTitle : text.trashEmptyTitle}
          </p>
          <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, marginBottom: "0" }}>
            {isRecentView ? text.recentEmptyDescription : isSharedView ? text.sharedEmptyDescription : text.trashEmptyDescription}
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "3rem",
          paddingBottom: "3rem",
          textAlign: "center",
          width: "100%",
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 52, color: THEME_COLORS.textMuted }} />
        <p style={{ marginBottom: "0.25rem", marginTop: "0.5rem", fontWeight: THEME_TYPE.weightStrong, fontSize: THEME_TYPE.fontSize14, color: THEME_COLORS.textBody }}>
          {atRootsView ? text.rootsEmptyTitle : text.folderEmptyTitle}
        </p>
        <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, marginBottom: "1rem" }}>
          {atRootsView ? text.rootsEmptyDescription : text.folderEmptyDescription}
        </p>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setActiveModal(atRootsView ? "new-root" : "new-folder")}
          sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize13 }}
        >
          <CreateNewFolderIcon sx={{ fontSize: 16, mr: 0.5 }} />
          {atRootsView ? text.newStorage : text.newFolder}
        </Button>
      </div>
    );
  };

  const renderGridTile = (item) => {
    const isSelected = selectedIds.has(item.id);
    const isDropTarget = item.kind === "folder" && dropFolderId === item.id;
    const isImage = !isTrashView && item.kind === "file" && mimeFamily(item.mime_type) === "image";
    const dropHandlers = item.kind === "folder" ? folderDropHandlers(item) : {};

    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        data-storage-tile={item.id}
        aria-pressed={isSelected}
        onClick={(event) => selectItem(item, event)}
        onDoubleClick={() => openItem(item)}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedIds((previous) => (previous.has(item.id) ? previous : new Set([item.id])));
          setContextMenu({ item, mouseX: event.clientX, mouseY: event.clientY });
        }}
        className={`storage-tile ${isDropTarget ? "storage-drop-target" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem",
          height: "100%",
          borderRadius: THEME_RADII.md,
          border: `1px solid ${
            cursorId === item.id || isSelected ? THEME_COLORS.brandPrimary : THEME_COLORS.borderMuted
          }`,
          background: isSelected ? THEME_COLORS.selected : THEME_COLORS.white,
          // The border IS the focus indicator here, so the theme's own outline (a stray amber ring
          // that survived on the previously clicked tile) is replaced by it. No shadow: in this kit
          // a card never lifts.
          outline: "none",
          boxShadow: "none",
          cursor: "pointer",
          userSelect: "none",
        }}
        {...itemDragHandlers(item)}
        {...dropHandlers}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem", height: 48 }}>
          {isImage ? <StorageImageThumbnail service={service} item={item} fallback={itemIcon(item)} /> : itemIcon(item)}
        </div>
        <p
          style={{
            textAlign: "center",
            margin: "0",
            width: "100%",
            fontSize: THEME_TYPE.fontSize12,
            lineHeight: 1.25,
            color: THEME_COLORS.textBody,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
          title={item.name}
        >
          {item.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
          {isTrashView ? (
            <span style={{ fontSize: THEME_TYPE.fontSize11, color: THEME_COLORS.textMuted }}>Deleted {formatDate(item.deleted?.timestamp)}</span>
          ) : (
            <>
              {!isUserScope && item.is_root && item.rename_locked && rootOwnerOf(item) && (
                <>
                  <LockIcon sx={{ fontSize: 12, color: THEME_COLORS.textMuted }} />
                  <Chip
                    label={rootOwnerOf(item).label}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: THEME_TYPE.fontSize11,
                      fontWeight: 600,
                      bgcolor: tint(THEME_COLORS.brandAccent, 10),
                      color: THEME_COLORS.brandPrimary,
                    }}
                  />
                </>
              )}
              {item.kind === "file" && (
                <span style={{ fontSize: THEME_TYPE.fontSize11, color: THEME_COLORS.textMuted }}>{formatFileSize(item.size_bytes)}</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // The list's row menu is declared once for every row, so each host action appears as one entry
  // hidden on the rows whose `itemActions` do not return it.
  const customListActions = (() => {
    const actionsById = new Map();
    visibleItems.forEach((item) =>
      customActionsFor(item).forEach((customAction) => actionsById.set(customAction.id, customAction)),
    );

    if (!actionsById.size) {
      return [];
    }

    return [
      { id: "custom-divider", type: "divider" },
      ...[...actionsById.values()].map((customAction) => ({
        id: `${CUSTOM_ACTION_PREFIX}${customAction.id}`,
        icon: customAction.icon,
        label: customAction.label,
        type: "action",
        hidden: (row) => !customActionsFor(row).some((candidate) => candidate.id === customAction.id),
      })),
    ];
  })();

  const readOnlyListActions = [
    {
      id: "copy",
      label: "Copy Actions",
      type: "group",
      items: [
        { id: "copy-id", label: "Copy Id" },
        { id: "copy-link", label: "Copy link" },
        { id: "new-tab", label: "New tab" },
      ],
    },
    {
      id: "open",
      icon: <OpenInNewIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
      label: "Open",
      type: "action",
    },
    {
      id: "share",
      icon: <IosShareIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
      label: "Share",
      type: "action",
    },
    {
      id: "download",
      icon: <DownloadIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
      label: "Download",
      type: "action",
    },
    ...customListActions,
  ];

  const chooserListActions = [
    {
      id: "open",
      icon: <OpenInNewIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
      label: "Open",
      type: "action",
    },
    {
      id: "download",
      icon: <DownloadIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
      label: "Download",
      type: "action",
    },
  ];

  const listActions = chooser
    ? chooserListActions
    : isSharedView
    ? readOnlyListActions
    : isTrashView
    ? [
        {
          id: "restore",
          icon: <RestoreFromTrashIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Restore",
          type: "action",
        },
        {
          id: "delete",
          icon: <DeleteForeverIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Delete forever",
          type: "action",
        },
      ]
    : [
        {
          id: "copy",
          label: "Copy Actions",
          type: "group",
          items: [
            { id: "copy-id", label: "Copy Id" },
            { id: "copy-link", label: "Copy link" },
            { id: "new-tab", label: "New tab" },
          ],
        },
        {
          id: "open",
          icon: <OpenInNewIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Open",
          type: "action",
        },
        {
          id: "share",
          icon: <IosShareIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Share",
          type: "action",
        },
        {
          id: "rename",
          icon: <RenameIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Rename",
          type: "action",
        },
        {
          id: "download",
          icon: <DownloadIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Download",
          type: "action",
        },
        {
          id: "delete",
          icon: <DeleteIcon style={{ marginRight: "0.25rem", color: THEME_COLORS.textSecondary }} fontSize="small" />,
          label: "Delete",
          type: "action",
        },
        ...customListActions,
      ];

  const listColumns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1.6,
      minWidth: 220,
      renderCell: (params) => (
        <button
          type="button"
          onClick={(event) => selectItem(params.row, event)}
          onDoubleClick={() => openItem(params.row)}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelectedIds((previous) => (previous.has(params.row.id) ? previous : new Set([params.row.id])));
            setContextMenu({ item: params.row, mouseX: event.clientX, mouseY: event.clientY });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            border: 0,
            background: "transparent",
            padding: "0",
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
          }}
        >
          {itemIcon(params.row, 20)}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: THEME_TYPE.weightMedium, fontSize: THEME_TYPE.fontSize13 }}>
            {params.row.name}
          </span>
          {params.row.rename_locked && <LockIcon sx={{ fontSize: 12, color: THEME_COLORS.textMuted }} />}
        </button>
      ),
    },
    {
      field: "access",
      headerName: "Access",
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => {
        if (params.row.kind === "folder") return <span style={{ color: THEME_COLORS.textSecondary, fontSize: THEME_TYPE.fontSize12 }}>--</span>;
        const visibility = params.row.access?.visibility || "private";
        const color = visibility === "public" ? THEME_COLORS.success : THEME_COLORS.brandPrimary;
        return (
          <Chip
            label={VISIBILITY_LABELS[visibility] || visibility}
            size="small"
            sx={{ height: 20, fontSize: THEME_TYPE.fontSize11, fontWeight: 600, bgcolor: tint(color, 10), color }}
          />
        );
      },
    },
    {
      field: "size_bytes",
      headerName: "Size",
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) =>
        params.row.kind === "folder" ? (
          <span style={{ color: THEME_COLORS.textSecondary, fontSize: THEME_TYPE.fontSize12 }}>--</span>
        ) : (
          <span style={{ fontSize: THEME_TYPE.fontSize12 }}>{formatFileSize(params.row.size_bytes)}</span>
        ),
    },
    isTrashView
      ? {
          field: "deleted",
          headerName: "Deleted",
          flex: 0.6,
          minWidth: 100,
          renderCell: (params) => <span style={{ fontSize: THEME_TYPE.fontSize12 }}>{formatDate(params.row.deleted?.timestamp)}</span>,
        }
      : {
          field: "modified",
          headerName: "Modified",
          flex: 0.6,
          minWidth: 100,
          renderCell: (params) => <span style={{ fontSize: THEME_TYPE.fontSize12 }}>{formatDate(params.row.modified?.timestamp)}</span>,
        },
    {
      field: "actions",
      headerName: "Actions",
      type: "string",
      sortable: false,
      disableColumnMenu: true,
      editable: false,
      renderCell: "actions",
    },
  ];

  const renderContent = () => {
    if (isLoading) {
      return renderSkeleton();
    }

    if (loadError) {
      return (
        <div
          role="alert"
          style={{
            textAlign: "center",
            width: "75%",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "1rem",
            borderRadius: THEME_RADII.md,
            background: THEME_COLORS.surfaceTrack,
            color: THEME_COLORS.textBody,
          }}
        >
          {loadError}{" "}
          <MuiLink component="button" onClick={refresh} underline="hover">
            Retry
          </MuiLink>
        </div>
      );
    }

    if (!visibleItems.length) {
      return searchText ? (
        <p
          style={{
            fontSize: THEME_TYPE.fontSize12,
            color: THEME_COLORS.textSecondary,
            textAlign: "center",
            paddingTop: "3rem",
            paddingBottom: "3rem",
            margin: "0",
          }}
        >
          Nothing matches "{searchText}" here.
        </p>
      ) : (
        renderEmptyState()
      );
    }

    if (viewMode === "list") {
      return (
        <DataGrid
          columns={listColumns}
          rows={visibleItems}
          actions={listActions}
          enableActions
          onMenuItemClick={itemOnAction}
          pageSizeOptions={[20, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
          loading={isLoading}
          style={{ border: 0 }}
        />
      );
    }

    return (
      <div ref={gridRef} className="storage-grid" style={{ width: "100%" }}>
        {visibleItems.map((item) => renderGridTile(item))}
      </div>
    );
  };

  // The action bar rises with the FIRST selected item — selection is how you operate here.
  // The bar occupies its slot PERMANENTLY (fixed min-height): with no selection it shows a
  // quiet summary, with one it swaps to the action set in place — the content never jumps.
  // Both states of this band are the same box on purpose — same minHeight, same margin, same
  // border — because a control appearing must not displace the tile the user is about to click.
  const renderSelectionBar = () => {
    const single = selectedItems.length === 1 ? selectedItems[0] : null;
    const barButtonSx = { textTransform: "none", fontSize: THEME_TYPE.fontSize12, minWidth: 0, color: THEME_COLORS.textBody };

    // While choosing, the host's footer carries the count and the action, so this band never grows
    // verbs — but it is still rendered, at the same height, because removing it on selection would
    // pull the grid up under the pointer.
    if (chooser || !selectedItems.length) {
      return (
        <div
          className="storage-selection-bar storage-selection-bar--resting"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
            marginBottom: "0.5rem",
            borderRadius: THEME_RADII.sm,
            boxSizing: "border-box",
            height: 38,
            background: THEME_COLORS.surfaceTrack,
            border: `1px solid ${THEME_COLORS.borderMuted}`,
          }}
        >
          <span style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textMuted }}>
            {isLoading ? text.loading : text.itemCount(visibleItems.length)}
          </span>
          <span className="storage-selection-hint" style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textMuted }}>
            {text.selectionHint}
          </span>
        </div>
      );
    }

    return (
      <div
        className="storage-selection-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          paddingLeft: "0.5rem",
          paddingRight: "0.5rem",
          marginBottom: "0.5rem",
          borderRadius: THEME_RADII.sm,
          // Pinned, and never wrapping: the resting band is 38px, and a verb row that wrapped to
          // three lines at phone width would push the grid down the moment something is selected.
          flexWrap: "nowrap",
          overflow: "hidden",
          boxSizing: "border-box",
          height: 38,
          background: THEME_COLORS.selected,
          border: `1px solid ${THEME_COLORS.borderMuted}`,
        }}
      >
        <Tooltip title={text.clearSelection}>
          <IconButton className="storage-clear-selection" size="small" onClick={clearSelection} aria-label={text.clearSelection}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <span style={{ fontWeight: THEME_TYPE.weightStrong, marginRight: "0.25rem", fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.brandPrimary }}>
          {text.selectedCount(selectedItems.length)}
        </span>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {selectionCan.restore ? (
          <>
            <Button size="small" disabled={isBusy} onClick={() => restoreItems(selectedItems)} sx={barButtonSx}>
              <RestoreFromTrashIcon sx={{ fontSize: 15, mr: 0.5 }} />
              <span className="storage-verb-label">{text.restore}</span>
            </Button>
            <Button
              size="small"
              disabled={isBusy}
              onClick={() => openDeleteDialog(selectedItems)}
              sx={{ ...barButtonSx, color: THEME_COLORS.errorDark }}
            >
              <DeleteForeverIcon sx={{ fontSize: 15, mr: 0.5 }} />
              <span className="storage-verb-label">{text.deleteForever}</span>
            </Button>
          </>
        ) : (
          <>
            {single && selectionCan.share && (
              <Tooltip title={text.share}>
                <Button size="small" onClick={() => itemOnAction("share", single)} sx={barButtonSx}>
                  <IosShareIcon sx={{ fontSize: 15, mr: 0.5 }} />
                  <span className="storage-verb-label">{text.share}</span>
                </Button>
              </Tooltip>
            )}
            {single && selectionCan.download && (
              <Tooltip title={text.download}>
                <Button size="small" onClick={() => downloadItem(single)} sx={barButtonSx}>
                  <DownloadIcon sx={{ fontSize: 15, mr: 0.5 }} />
                  <span className="storage-verb-label">{text.download}</span>
                </Button>
              </Tooltip>
            )}
            {single && selectionCan.copyLink && (
              <Tooltip title={text.copyLink}>
                <Button size="small" onClick={() => copyItemLink(single)} sx={barButtonSx}>
                  <ContentCopyIcon sx={{ fontSize: 15, mr: 0.5 }} />
                  <span className="storage-verb-label">{text.copyLink}</span>
                </Button>
              </Tooltip>
            )}
            {single && canMutate && selectionCan.rename && (
              <>
                <Tooltip title={text.rename}>
                  <span>
                    <Button size="small" onClick={() => itemOnAction("rename", single)} sx={barButtonSx}>
                      <RenameIcon sx={{ fontSize: 15, mr: 0.5 }} />
                      <span className="storage-verb-label">{text.rename}</span>
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            {canMutate && selectionCan.move && (
              <>
            <Tooltip title={text.moveTo}>
              <span>
                <Button
                  size="small"
                  onClick={() => {
                    setModalTarget(selectedItems.filter((item) => !item.is_root));
                    setActiveModal("move");
                  }}
                  sx={barButtonSx}
                >
                  <DriveFileMoveIcon sx={{ fontSize: 15, mr: 0.5 }} />
                  <span className="storage-verb-label">{text.move}</span>
                </Button>
              </span>
            </Tooltip>
            </>
            )}
            {canMutate && selectionCan.trash && (
              <Tooltip title={text.delete}>
                <span>
                  <Button
                    size="small"
                    disabled={isBusy}
                    onClick={() => openDeleteDialog(selectedItems)}
                    sx={{ ...barButtonSx, color: THEME_COLORS.errorDark }}
                  >
                    <DeleteIcon sx={{ fontSize: 15, mr: 0.5 }} />
                    <span className="storage-verb-label">{text.delete}</span>
                  </Button>
                </span>
              </Tooltip>
            )}
          </>
        )}
      </div>
    );
  };

  const contextItem = contextMenu?.item;

  // One shape for every menu row so labels and shortcuts line up across both menus.
  const menuEntry = (entry) => {
    const { key, label, shortcut, onClick, disabled = false, danger = false, icon } = entry;
    const EntryIcon = entry.Icon;

    return (
      <MenuItem
        key={key}
        onClick={onClick}
        disabled={disabled}
        sx={{ fontSize: THEME_TYPE.fontSize13, ...(danger ? { color: THEME_COLORS.errorDark } : {}) }}
      >
        <ListItemIcon>
          {EntryIcon ? <EntryIcon sx={{ fontSize: 16, ...(danger ? { color: THEME_COLORS.errorDark } : {}) }} /> : icon}
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{label}</ListItemText>
        {shortcut && (
          <span style={{ marginLeft: "1rem" }}>
            <ShortcutKeys spec={shortcut} />
          </span>
        )}
      </MenuItem>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <section
      className="storage-browser-root"
      ref={browserRootRef}
      tabIndex={0}
      onDragEnter={onAreaDragEnter}
      onDragOver={(event) => {
        if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
      }}
      onDragLeave={onAreaDragLeave}
      onDrop={onAreaDrop}
      onContextMenu={(event) => {
        // Empty-space right click: the creation menu. Item tiles and list name-cells stop
        // propagation first; anywhere inside the DataGrid is row territory, not empty space.
        if (isFlatView || event.target.closest?.(".MuiDataGrid-root")) return;
        event.preventDefault();
        setCreationMenu({ mouseX: event.clientX, mouseY: event.clientY });
      }}
      style={{ width: "100%", position: "relative", outline: "none" }}
    >
      <style>{BROWSER_STYLES}</style>

      <input
        ref={uploadInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          startUpload([...(event.target.files || [])], null);
          event.target.value = "";
        }}
      />

      {renderToolbar()}
      {/* The slot is the query container: the bar collapses when the BAR is narrow, whatever the
          browser, the app or the window happen to be. */}
      <div className="storage-selection-slot">{renderSelectionBar()}</div>

      <div className="storage-body">
        {renderTreePanel()}
        <div style={{ flexGrow: 1, minWidth: 0 }}>{renderContent()}</div>
      </div>

      {/* Drop overlay for OS files */}
      {isDropActive && !dropFolderId && !atRootsView && !isFlatView && (
        <div
          className="storage-drop-overlay"
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            inset: 0,
            background: tint(THEME_COLORS.page, 92),
            border: `1px dashed ${THEME_COLORS.brandPrimary}`,
            borderRadius: THEME_RADII.md,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <CloudUploadIcon sx={{ fontSize: 46, color: THEME_COLORS.brandPrimary }} />
            <p style={{ fontWeight: THEME_TYPE.weightStrong, margin: "0", color: THEME_COLORS.brandPrimary, fontSize: THEME_TYPE.fontSize14 }}>
              Drop files to upload to {currentFolder?.name || "this folder"}
            </p>
          </div>
        </div>
      )}

      {/* Item context menu — every entry carries its shortcut on the right */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        PaperProps={{ sx: { width: 250, borderRadius: "8px" } }}
      >
        {isTrashView
          ? [
              menuEntry({
                key: "restore",
                Icon: RestoreFromTrashIcon,
                label: text.putBack,
                shortcut: SHORTCUTS.restore,
                onClick: () => itemOnAction("restore", contextItem),
              }),
              menuEntry({
                key: "purge",
                Icon: DeleteForeverIcon,
                label: text.deleteForever,
                shortcut: SHORTCUTS.purge,
                danger: true,
                onClick: () => itemOnAction("delete", contextItem),
              }),
            ]
          : [
              menuEntry({
                key: "open",
                Icon: OpenInNewIcon,
                label: text.open,
                shortcut: SHORTCUTS.open,
                onClick: () => itemOnAction("open", contextItem),
              }),
              contextItem?.is_root &&
                rootOwnerOf(contextItem) &&
                !isAnchored &&
                routing.onOpenOwner &&
                menuEntry({
                  key: "open-owner",
                  Icon: rootOwnerOf(contextItem).Icon,
                  label: rootOwnerOf(contextItem).action,
                  onClick: () => {
                    const owner = rootOwnerOf(contextItem);
                    setContextMenu(null);
                    routing.onOpenOwner({ type: owner.type, id: contextItem[owner.key] });
                  },
                }),
              contextItem?.kind === "file" &&
                menuEntry({
                  key: "download",
                  Icon: DownloadIcon,
                  label: text.download,
                  shortcut: SHORTCUTS.download,
                  onClick: () => itemOnAction("download", contextItem),
                }),
              !chooser &&
                menuEntry({
                  key: "copy-link",
                  Icon: ContentCopyIcon,
                  label: text.copyLink,
                  shortcut: SHORTCUTS.copyLink,
                  onClick: () => itemOnAction("copy-link", contextItem),
                }),
              !chooser &&
                contextItem?.kind === "file" &&
                menuEntry({
                  key: "share",
                  Icon: IosShareIcon,
                  label: text.shareEllipsis,
                  shortcut: SHORTCUTS.share,
                  onClick: () => itemOnAction("share", contextItem),
                }),
              canMutate && <Divider key="d1" />,
              canMutate &&
                menuEntry({
                  key: "rename",
                  Icon: RenameIcon,
                  label: text.rename,
                  shortcut: SHORTCUTS.rename,
                  disabled: Boolean(contextItem?.rename_locked),
                  onClick: () => itemOnAction("rename", contextItem),
                }),
              canMutate &&
                menuEntry({
                  key: "move",
                  Icon: DriveFileMoveIcon,
                  label: text.moveTo,
                  shortcut: SHORTCUTS.move,
                  disabled: Boolean(contextItem?.is_root),
                  onClick: () => itemOnAction("move", contextItem),
                }),
              canMutate && <Divider key="d2" />,
              canMutate &&
                menuEntry({
                  key: "delete",
                  Icon: DeleteIcon,
                  label: text.delete,
                  shortcut: SHORTCUTS.trash,
                  danger: true,
                  disabled: Boolean(contextItem?.is_root && contextItem?.rename_locked),
                  onClick: () => itemOnAction("delete", contextItem),
                }),
              ...(contextItem && customActionsFor(contextItem).length ? [<Divider key="d3" />] : []),
              ...(contextItem
                ? customActionsFor(contextItem).map((customAction) =>
                    menuEntry({
                      key: `${CUSTOM_ACTION_PREFIX}${customAction.id}`,
                      icon: customAction.icon,
                      label: customAction.label,
                      onClick: () => itemOnAction(`${CUSTOM_ACTION_PREFIX}${customAction.id}`, contextItem),
                    }),
                  )
                : []),
            ]}
      </Menu>

      {/* Empty-space creation menu */}
      <Menu
        open={Boolean(creationMenu)}
        onClose={() => setCreationMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={creationMenu ? { top: creationMenu.mouseY, left: creationMenu.mouseX } : undefined}
        PaperProps={{ sx: { width: 240, borderRadius: "8px" } }}
      >
        {[
          menuEntry({
            key: "new-folder",
            Icon: CreateNewFolderIcon,
            label: atRootsView ? text.newStorage : text.newFolder,
            shortcut: SHORTCUTS.newFolder,
            onClick: () => {
              setCreationMenu(null);
              setModalTarget(null);
              setActiveModal(atRootsView ? "new-root" : "new-folder");
            },
          }),
          !atRootsView &&
            menuEntry({
              key: "upload",
              Icon: UploadIcon,
              label: text.uploadFiles,
              shortcut: SHORTCUTS.upload,
              onClick: () => {
                setCreationMenu(null);
                uploadInputRef.current?.click();
              },
            }),
          <Divider key="d1" />,
          menuEntry({
            key: "trashbox",
            Icon: TrashboxIcon,
            label: text.openTrashbox,
            shortcut: SHORTCUTS.trashbox,
            onClick: () => {
              setCreationMenu(null);
              openTrash();
            },
          }),
          menuEntry({
            key: "shortcuts",
            Icon: KeyboardIcon,
            label: text.keyboardShortcuts,
            shortcut: SHORTCUTS.help,
            onClick: () => {
              setCreationMenu(null);
              setActiveModal("shortcuts");
            },
          }),
        ]}
      </Menu>

      {/* Upload queue */}
      <StorageUploadQueue
        service={service}
        batch={uploadBatch}
        onFileUploaded={() => refresh()}
        onOpenItem={(uploaded) => {
          setModalTarget(uploaded);
          setActiveModal("preview");
        }}
        onDismiss={() => setUploadBatch(null)}
      />

      {/* Modals */}
      <PopUp
        data-testid="popup-modal"
        id="popup-modal"
        isOpen={Boolean(activeModal)}
        setIsOpen={(isOpen) => {
          if (!isOpen) closeModals();
        }}
        styles={{
          borderRadius: THEME_RADII.md,
          overflow: "hidden",
          background: THEME_COLORS.white,
          fontFamily: "var(--stos-font-ui, inherit)",
        }}
      >
        {(activeModal === "new-folder" || activeModal === "new-root") && (
          <StorageNameDialog
            mode={activeModal === "new-root" ? "create-root" : "create-folder"}
            isBusy={isBusy}
            onSubmit={createFolder}
            onCancel={closeModals}
          />
        )}
        {activeModal === "rename" && modalTarget && (
          <StorageNameDialog
            mode="rename"
            initialName={modalTarget.name}
            isBusy={isBusy}
            onSubmit={(name) => renameItem(modalTarget, name)}
            onCancel={closeModals}
          />
        )}
        {activeModal === "move" && Array.isArray(modalTarget) && (
          <StorageMoveDialog
            service={service}
            organizationId={organizationId}
            floorId={isAnchored ? anchorRootId : ""}
            items={modalTarget}
            currentFolderName={currentFolder?.name || ""}
            isBusy={isBusy}
            onSubmit={(destinationId) => moveItems(modalTarget, destinationId)}
            onCancel={closeModals}
          />
        )}
        {activeModal === "share" && modalTarget && !Array.isArray(modalTarget) && (
          <StorageShareDialog
            service={service}
            directory={services?.directory}
            viewerIdentity={viewerIdentity}
            item={modalTarget}
            onUpdated={(updated) => {
              setModalTarget(updated);
              refresh();
            }}
            onClose={closeModals}
          />
        )}
        {activeModal === "shortcuts" && <StorageShortcutsDialog onClose={closeModals} />}
        {activeModal === "delete" && Array.isArray(modalTarget) && (
          <StorageDeleteDialog
            items={modalTarget}
            mode={isTrashView ? "purge-only" : "both"}
            startOnPurge={deleteStartsOnPurge}
            isBusy={isBusy}
            onTrash={() => trashItems(modalTarget)}
            onPurge={() => purgeItems(modalTarget)}
            onCancel={closeModals}
          />
        )}
        {activeModal === "preview" && modalTarget && !Array.isArray(modalTarget) && (
          <StorageObjectPreview
            service={service}
            item={modalTarget}
            initialInfoOpen={previewWithInfo}
            onRename={() => setActiveModal("rename")}
            onMove={() => {
              setModalTarget([modalTarget]);
              setActiveModal("move");
            }}
            onDelete={() => openDeleteDialog([modalTarget])}
            onShare={() => setActiveModal("share")}
            onUpdated={(updated) => {
              setModalTarget(updated);
              refresh();
            }}
          />
        )}
      </PopUp>
    </section>
  );
}

export default StorageBrowser;

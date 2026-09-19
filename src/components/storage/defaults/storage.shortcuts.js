/**
 * Keyboard vocabulary for the storage browser.
 *
 * Follows the SDK's own conventions: platform detection copied from `OmniSearchTrigger`
 * (userAgentData first, userAgent regex as fallback — `navigator.platform` is deprecated),
 * shortcuts declared as dash-joined specs ("mod-shift-c") and rendered as one `<kbd>` chip per
 * key, exactly like the SDK's tiptap toolbar does.
 *
 * The reference file manager is the platform's own: Finder on macOS, Explorer on Windows —
 * so ⌘⌫ moves to trash on a Mac while Del does it on Windows, and Shift+Del / ⌥⌘⌫ delete for
 * good on each. Two deliberate departures:
 *   - Enter OPENS instead of renaming (Finder's Enter-to-rename surprises everyone who is not
 *     a lifelong Mac user; it is also what Explorer already does); rename keeps F2.
 *   - Where the platform combo is owned by the browser and cannot be intercepted (⌘1/⌘2 and
 *     Ctrl+1/Ctrl+2 switch tabs, ⇧⌘N/Ctrl+Shift+N open incognito windows), the command gets a
 *     bare letter instead — bare letters are free here because this surface has no type-ahead.
 */

export const IS_MAC =
  typeof navigator !== "undefined" &&
  (navigator.userAgentData?.platform === "macOS" || /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || ""));

// Same table the SDK uses, extended with the keys a file manager needs.
const MAC_SYMBOLS = {
  mod: "⌘",
  alt: "⌥",
  shift: "⇧",
  enter: "↵",
  backspace: "⌫",
  del: "⌫",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  space: "Space",
};

const WINDOWS_LABELS = {
  mod: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  enter: "Enter",
  backspace: "Backspace",
  del: "Del",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  space: "Space",
};

const formatShortcutKey = (key) => {
  const lowerKey = key.toLowerCase();

  if (IS_MAC) {
    return MAC_SYMBOLS[lowerKey] || key.toUpperCase();
  }

  return WINDOWS_LABELS[lowerKey] || key.charAt(0).toUpperCase() + key.slice(1);
};

/**
 * "mod-shift-c" → ["⌘", "⇧", "C"] on macOS, ["Ctrl", "Shift", "C"] on Windows.
 */
export function parseShortcut(spec) {
  if (!spec) return [];
  return spec
    .split("-")
    .map((key) => key.trim())
    .filter(Boolean)
    .map(formatShortcutKey);
}

/**
 * Every command, in the combo its own platform's file manager uses.
 */
export const SHORTCUTS = {
  open: "enter",
  openAlt: IS_MAC ? "mod-down" : "",
  quickLook: "space",
  goUp: IS_MAC ? "mod-up" : "alt-up",
  back: IS_MAC ? "mod-left" : "alt-left",
  forward: IS_MAC ? "mod-right" : "alt-right",
  selectAll: "mod-a",
  clear: "esc",
  rename: "f2",
  trash: IS_MAC ? "mod-backspace" : "del",
  purge: IS_MAC ? "alt-mod-backspace" : "shift-del",
  restore: IS_MAC ? "mod-backspace" : "mod-z",
  info: IS_MAC ? "mod-i" : "alt-enter",
  copyLink: IS_MAC ? "alt-mod-c" : "mod-shift-c",
  share: "s",
  download: "d",
  move: "m",
  newFolder: "n",
  upload: "u",
  trashbox: "t",
  search: "mod-f",
  grid: "1",
  list: "2",
  refresh: "r",
  help: "?",
};

export const SHORTCUT_GROUPS = [
  {
    title: "Move around",
    items: [
      { spec: "up", extra: ["down", "left", "right"], label: "Move the selection" },
      { spec: "shift-up", extra: ["shift-down", "shift-left", "shift-right"], label: "Extend the selection" },
      { spec: SHORTCUTS.open, label: "Open — folders navigate, files preview" },
      { spec: SHORTCUTS.quickLook, label: "Quick look — same preview" },
      { spec: SHORTCUTS.goUp, label: "Go up one folder" },
      { spec: SHORTCUTS.back, label: "Back" },
      { spec: SHORTCUTS.forward, label: "Forward" },
      { spec: SHORTCUTS.selectAll, label: "Select everything here" },
      { spec: SHORTCUTS.clear, label: "Clear the selection" },
    ],
  },
  {
    title: "Act on the selection",
    items: [
      { spec: SHORTCUTS.rename, label: "Rename" },
      { spec: SHORTCUTS.move, label: "Move to…" },
      { spec: SHORTCUTS.share, label: "Share…" },
      { spec: SHORTCUTS.download, label: "Download" },
      { spec: SHORTCUTS.copyLink, label: "Copy link" },
      { spec: SHORTCUTS.info, label: "Details" },
      { spec: SHORTCUTS.trash, label: "Move to trash" },
      { spec: SHORTCUTS.restore, label: "Put back (in the Trashbox)" },
      { spec: SHORTCUTS.purge, label: "Delete permanently" },
    ],
  },
  {
    title: "This folder",
    items: [
      { spec: SHORTCUTS.newFolder, label: "New folder" },
      { spec: SHORTCUTS.upload, label: "Upload files" },
      { spec: SHORTCUTS.search, label: "Search here" },
      { spec: SHORTCUTS.trashbox, label: "Open the Trashbox" },
      { spec: SHORTCUTS.grid, extra: ["2"], label: "Grid / list view" },
      { spec: SHORTCUTS.refresh, label: "Refresh" },
      { spec: SHORTCUTS.help, label: "This list" },
    ],
  },
];

/**
 * True when the event carries the platform's command modifier (⌘ on Apple, Ctrl elsewhere).
 */
export function hasCommandModifier(event) {
  return IS_MAC ? event.metaKey : event.ctrlKey;
}

/**
 * Keystrokes must not be stolen while the person is typing.
 */
export function isTypingTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

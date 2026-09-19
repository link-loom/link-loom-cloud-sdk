/**
 * What a person may actually do with one storage object.
 *
 * The rules live here, once, because every surface that lists files has to agree with the backend
 * and with each other. Deriving them from the OBJECT — its kind, its status, who owns it — rather
 * than from the view it happens to be rendered in is the point: a view that did not exist when
 * this was written inherits correct behaviour, and no view can quietly grow its own opinion.
 * That is exactly how Drive's Home ended up a dead end, offering no actions on a file the user
 * owned simply because it was drawn by a different component than My files.
 *
 * Each flag mirrors a backend rule:
 * - `share`, `rename`, `move`, `trash`: owner only, and never on a system folder or a trashed
 *   object. A grantee is refused by `#assertObjectOwner` / `#assertSpaceWritable`, so offering
 *   them a Share button would only produce a 403.
 * - `restore`, `purge`: only meaningful once the object is in the trash.
 * - `download`, `copyLink`: any reader, including a grantee — `share-token` is grant-aware.
 * - `open`: files preview, folders navigate. Both are "open", the caller decides what that means.
 */
const DELETED = "deleted";

export const STORAGE_VERBS = [
  "open",
  "download",
  "copyLink",
  "share",
  "rename",
  "move",
  "trash",
  "restore",
  "purge",
];

const NOTHING = STORAGE_VERBS.reduce((all, verb) => ({ ...all, [verb]: false }), {});

/**
 * @param {object} item A storage object as the API presents it.
 * @param {object} context `viewerIdentity` is the signed-in Veripass identity. When it is absent
 *   (the operator console, which owns every space) ownership is not in question and every rule
 *   that depends on it passes.
 * @returns {object} one boolean per verb in STORAGE_VERBS.
 */
export function storageCapabilities(item, { viewerIdentity = "" } = {}) {
  if (!item?.id) {
    return { ...NOTHING };
  }

  const isFolder = item.kind === "folder";
  const isTrashed = item.status?.name === DELETED;
  const isSystem = Boolean(item.system_space);
  const isRoot = item.is_root === true;
  // No viewer identity means an operator, who owns every space by definition.
  const isOwner = !viewerIdentity || !item.owner_veripass_identity || item.owner_veripass_identity === viewerIdentity;
  const structural = isOwner && !isSystem && !isTrashed;

  return {
    open: true,
    download: !isFolder && !isTrashed,
    copyLink: !isFolder && !isTrashed,
    // Sharing is per-file and owner-only; folder sharing is not modelled yet.
    share: !isFolder && structural,
    rename: structural && !item.rename_locked,
    move: structural && !isRoot,
    trash: structural && !(isRoot && item.rename_locked),
    restore: isTrashed,
    purge: isTrashed || (isOwner && !isSystem && !(isRoot && item.rename_locked)),
  };
}

/**
 * The verbs legal for EVERY object in a selection. A bar built from this never offers an action
 * that would fail on one of the things it is pointing at.
 */
export function selectionCapabilities(items = [], context = {}) {
  if (!items.length) {
    return { ...NOTHING };
  }

  return items
    .map((item) => storageCapabilities(item, context))
    .reduce((all, next) => {
      STORAGE_VERBS.forEach((verb) => {
        all[verb] = all[verb] && next[verb];
      });
      return all;
    });
}

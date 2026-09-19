/**
 * Plain-language copy for the Storage surfaces.
 *
 * Written for someone who has never administered a file server. Every entry says what the thing
 * does for them; the engine jargon (blob, container, token version, ancestor chain) stays out of
 * user-visible strings entirely.
 */

export const STORAGE_HELP = {
  // ── Structure ───────────────────────────────────────────────────────────
  storageRoot:
    "A top-level space, like a drive. Each workload gets its own, named after the workload, and you can add free-standing ones for anything else.",
  workloadRoot:
    "This folder belongs to a workload and keeps its name, because links that are already published point through it. You can organize everything inside it freely.",
  folder: "Folders nest like on your computer. Renaming or moving one never breaks the files inside it.",

  // ── Sharing ─────────────────────────────────────────────────────────────
  visibility:
    "Who can open a file's link. Public: anyone, no sign-in — right for logos and images on pages. Link with expiration: the link carries a pass that stops working after a while. Private: only the owning workload can create links at all.",
  publicLink:
    "This address is stable and needs no credential. Paste it anywhere — it serves the file directly, like any image URL.",
  expiringLink: "The link works until the date shown, then quietly stops. Generate a fresh one whenever you need to share again.",
  revokeLinks:
    "Cuts off every link handed out so far for this file, at once. People with an old link get an error; you can generate new ones right after.",
  modifiable: "Whether the owning workload may replace this file's content through the API. Off means upload-once.",

  // ── Deleting ────────────────────────────────────────────────────────────
  softDelete:
    "Moves the item out of sight but keeps the actual file, so this can be undone by support. The stored bytes still count toward your usage.",
  purge:
    "Deletes the item AND its stored file, permanently. There is no undo, and links to it die immediately. This is what actually frees storage space.",

  // ── Usage ───────────────────────────────────────────────────────────────
  usage:
    "How much is stored, in bytes and files, per workload. If your plan includes a storage limit, uploads stop when you would pass it — free space by purging or upgrade the plan.",
};

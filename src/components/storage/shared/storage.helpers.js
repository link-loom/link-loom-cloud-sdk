/**
 * Storage view helpers — size formatting, mime → icon mapping and the flat-list → tree fold the
 * backend's `tree` queryselector is designed for. File URLs come from the storage service.
 */

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "--";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Coarse mime family for icon/preview decisions: image | video | audio | pdf | file.
 */
export function mimeFamily(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}

/**
 * Fold the flat `tree` queryselector result into nested nodes `{ ...node, children: [] }`.
 * Roots (or nodes whose parent is outside the fetched set) float to the top level. Children are
 * name-sorted so the panel is stable across refreshes.
 */
export function buildTree(nodes = []) {
  const byId = new Map(nodes.map((node) => [node.id, { ...node, children: [] }]));
  const top = [];

  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : null;

    if (parent) {
      parent.children.push(node);
    } else {
      top.push(node);
    }
  });

  const sortChildren = (list) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((node) => sortChildren(node.children));
  };
  sortChildren(top);

  return top;
}

/**
 * Download through a hidden link so the host tab never navigates to a raw file URL.
 */
export function triggerFileDownload(url, filename = "") {
  if (!url) return;
  const downloadUrl = url.startsWith("blob:") || /[?&]download=1/.test(url) ? url : `${url}${url.includes("?") ? "&" : "?"}download=1`;
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

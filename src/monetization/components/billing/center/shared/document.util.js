/**
 * Hand a fetched document to the browser. Documents are fetched with the caller's headers (a plain
 * link cannot carry them), so they arrive as blobs and are opened or saved from an object URL.
 */
const REVOKE_AFTER_MS = 60 * 1000;

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

export function openBlob(blob) {
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

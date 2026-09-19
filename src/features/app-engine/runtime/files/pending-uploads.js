const BLOB_URL_PATTERN = /blob:[^\s"'<>()]+/g;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mapStrings = (value, transform) => {
  if (typeof value === "string") {
    return transform(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapStrings(item, transform));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapStrings(item, transform)]));
  }
  return value;
};

// `blob:` URLs inside any string of `value` that are placeholders of offline uploads:
// Map<url, { localId, resolved: { id, url } | null }>.
export const findUploadPlaceholders = (value, files) => {
  const placeholders = new Map();
  if (typeof files?.localIdFor !== "function") {
    return placeholders;
  }

  mapStrings(value, (text) => {
    for (const url of text.match(BLOB_URL_PATTERN) || []) {
      const localId = files.localIdFor(url);
      if (localId && !placeholders.has(url)) {
        placeholders.set(url, { localId, resolved: files.resolveSync?.(url) || null });
      }
    }
    return text;
  });
  return placeholders;
};

// Content never persists URLs of uploads. Synced ones become their storage object id: an HTML `src` becomes
// `src="" data-storage-id="<id>"` and any other occurrence the id. Pending ones become
// `src="" data-pending-upload="<localId>"` (or the local id), resolvable later through `sdk.files.resolve`.
export const replaceUploadPlaceholders = (value, placeholders) =>
  mapStrings(value, (text) =>
    [...placeholders.entries()].reduce((current, [url, { localId, resolved }]) => {
      if (!current.includes(url)) {
        return current;
      }
      const sourceAttribute = new RegExp(`src=(["'])${escapeRegExp(url)}\\1`, "g");
      if (resolved?.id) {
        return current.replace(sourceAttribute, `src="" data-storage-id="${resolved.id}"`).split(url).join(resolved.id);
      }
      return current.replace(sourceAttribute, `src="" data-pending-upload="${localId}"`).split(url).join(localId);
    }, text),
  );

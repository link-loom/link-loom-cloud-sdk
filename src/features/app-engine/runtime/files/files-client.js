import { RuntimeHttpError, isRetryableHttpError } from "../shared/runtime-http.client";
import { createUuid } from "../shared/runtime-ids";
import { enqueueUpload, listQueuedUploads, removeQueuedUpload } from "./upload-queue.store";

const UPLOAD_PATH = "/storage/object/upload";
const SHARE_TOKEN_PATH = "/storage/object/share-token";
const VIEW_URL_PATH = "/storage/object/view-url";
const USAGE_PATH = "/storage/object/usage";
const OBJECT_PATH = "/storage/object";
const USER_FILES_SPACE = "user-files";
const LOCAL_UPLOAD_PREFIX = "local-file-";
const RESOLVED_UPLOADS_KEY = "uploads:resolved";
const RESOLVED_UPLOADS_LIMIT = 200;
const URL_REFRESH_MARGIN_MS = 2 * 60 * 1000;

const appendDownload = (url, download) => {
  if (!download) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
};

const parseXhrBody = (xhr) => {
  try {
    return JSON.parse(xhr.responseText);
  } catch {
    return null;
  }
};

export default class AppFilesClient {
  constructor({ http, namespace, isOnline, storage = globalThis.localStorage }) {
    this._http = http;
    this._namespace = namespace;
    this._isOnline = isOnline || (() => globalThis.navigator?.onLine !== false);
    this._storage = storage;
    this._memoryResolved = {};
    this._placeholders = new Map();
    this._placeholderIds = new Map();
    this._urlCache = new Map();
    this._urlRequests = new Map();
    this._syncedListeners = new Set();
    this._replaying = null;
  }

  #buildFormData({ file, name, space, folderPath, parentId }) {
    const formData = new FormData();
    formData.append("file", file, name);
    formData.append("space", space);
    if (folderPath) {
      formData.append("folder_path", folderPath);
    }
    if (parentId) {
      formData.append("parent_id", parentId);
    }
    return formData;
  }

  // Content keeps `id`; `url` is a short-lived view URL for the uploader's immediate display, never persisted.
  async #toUploadResult(entity) {
    return {
      id: entity.id,
      name: entity.name,
      url: await this.getUrl(entity.id).catch(() => null),
      mime_type: entity.mime_type,
      size_bytes: entity.size_bytes,
      pending: false,
    };
  }

  // XMLHttpRequest is used because fetch exposes no upload progress.
  #send(formData, onProgress) {
    if (typeof XMLHttpRequest === "undefined") {
      return this._http.request({ method: "POST", path: UPLOAD_PATH, formData });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this._http.buildUrl(UPLOAD_PATH));
      Object.entries(this._http.headers()).forEach(([header, value]) => xhr.setRequestHeader(header, value));

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
          }
        };
      }

      xhr.onerror = () => reject(new RuntimeHttpError({ network: true }));
      xhr.onload = () => {
        const payload = parseXhrBody(xhr);
        if (xhr.status < 200 || xhr.status >= 300 || payload?.success === false) {
          reject(new RuntimeHttpError({ status: xhr.status, message: payload?.message, body: payload }));
          return;
        }
        resolve(payload?.result ?? payload);
      };
      xhr.send(formData);
    });
  }

  async upload(file, { space = "user-appdata", folderPath, parentId, onProgress } = {}) {
    if (!file) {
      throw new Error("file is required");
    }

    const name = file.name || "file";
    const request = { file, name, space, folderPath, parentId };

    if (this._isOnline()) {
      try {
        const entity = await this.#send(this.#buildFormData(request), onProgress);
        return await this.#toUploadResult(entity);
      } catch (error) {
        if (!isRetryableHttpError(error)) {
          throw error;
        }
      }
    }

    if (typeof indexedDB === "undefined") {
      throw new RuntimeHttpError({ network: true, message: "Offline uploads are not supported in this environment" });
    }

    const localId = `${LOCAL_UPLOAD_PREFIX}${createUuid()}`;
    await enqueueUpload({
      local_id: localId,
      namespace: this._namespace,
      blob: file,
      name,
      space,
      folder_path: folderPath || null,
      parent_id: parentId || null,
      queued_at: Date.now(),
    });

    const placeholderUrl = URL.createObjectURL(file);
    this._placeholders.set(localId, placeholderUrl);
    this._placeholderIds.set(placeholderUrl, localId);

    return { id: localId, name, url: placeholderUrl, mime_type: file.type || null, size_bytes: file.size ?? null, pending: true };
  }

  // Local ids and their final files survive reloads (next to the app data namespace) so documents saved
  // with a `data-pending-upload` marker resolve when they are opened again.
  #readResolved() {
    if (!this._storage) {
      return this._memoryResolved;
    }
    try {
      return JSON.parse(this._storage.getItem(`${this._namespace}${RESOLVED_UPLOADS_KEY}`) || "{}");
    } catch {
      return {};
    }
  }

  #writeResolved(localId, file) {
    const entries = Object.entries({ ...this.#readResolved(), [localId]: { id: file.id, resolved_at: Date.now() } })
      .sort(([, left], [, right]) => left.resolved_at - right.resolved_at)
      .slice(-RESOLVED_UPLOADS_LIMIT);
    const resolved = Object.fromEntries(entries);

    if (!this._storage) {
      this._memoryResolved = resolved;
      return;
    }
    try {
      this._storage.setItem(`${this._namespace}${RESOLVED_UPLOADS_KEY}`, JSON.stringify(resolved));
    } catch {
      this._memoryResolved = resolved;
    }
  }

  // Local id of an offline upload, from the local id itself or its `blob:` placeholder URL.
  localIdFor(localIdOrUrl) {
    if (typeof localIdOrUrl !== "string") {
      return null;
    }
    if (localIdOrUrl.startsWith(LOCAL_UPLOAD_PREFIX)) {
      return localIdOrUrl;
    }
    return this._placeholderIds.get(localIdOrUrl) || null;
  }

  // `{ id }` of the uploaded file once the offline upload synced; null while pending or unknown.
  resolveSync(localIdOrUrl) {
    const localId = this.localIdFor(localIdOrUrl);
    if (!localId) {
      return null;
    }
    const resolved = this.#readResolved()[localId] || this._memoryResolved[localId];
    return resolved ? { id: resolved.id } : null;
  }

  async resolve(localIdOrUrl, { recordId } = {}) {
    const resolved = this.resolveSync(localIdOrUrl);
    if (!resolved) {
      return null;
    }
    return { id: resolved.id, url: await this.getUrl(resolved.id, { recordId }).catch(() => null) };
  }

  async resolveUrl(localIdOrUrl, { recordId } = {}) {
    return (await this.resolve(localIdOrUrl, { recordId }))?.url || null;
  }

  onUploadSynced(callback) {
    this._syncedListeners.add(callback);
    return () => this._syncedListeners.delete(callback);
  }

  replayQueue() {
    if (this._replaying) {
      return this._replaying;
    }
    this._replaying = this.#drainQueue().finally(() => {
      this._replaying = null;
    });
    return this._replaying;
  }

  async #drainQueue() {
    if (!this._isOnline()) {
      return;
    }

    for (const entry of await listQueuedUploads(this._namespace)) {
      let entity;
      try {
        entity = await this.#send(
          this.#buildFormData({
            file: entry.blob,
            name: entry.name,
            space: entry.space,
            folderPath: entry.folder_path,
            parentId: entry.parent_id,
          }),
        );
      } catch (error) {
        if (isRetryableHttpError(error) || error.status === 401) {
          return;
        }
        await removeQueuedUpload(entry.local_id);
        continue;
      }

      await removeQueuedUpload(entry.local_id);
      const uploaded = await this.#toUploadResult(entity);
      this.#writeResolved(entry.local_id, uploaded);

      // The placeholder URL stays valid until dispose: editors swap it for the final URL on this event.
      this._syncedListeners.forEach((listener) => listener({ localId: entry.local_id, file: uploaded }));
    }
  }

  async shareToken(id, { ttlMinutes } = {}) {
    const result = await this._http.request({
      method: "POST",
      path: SHARE_TOKEN_PATH,
      body: { id, ...(ttlMinutes ? { ttl_minutes: ttlMinutes } : {}) },
    });

    return {
      token: result?.token || null,
      url: `${this._http.baseUrl}${result?.path || `/storage/file/${id}`}`,
      expires_at: result?.expires_at || null,
    };
  }

  // Short-lived URL to render or open a file. Content stores object ids; readers mint URLs on render.
  // `recordId` names the App Data record that references the file, so readers the record is shared
  // with qualify. Cached per (id, recordId) until shortly before expiry; concurrent calls share one request.
  async getUrl(id, { download = false, recordId } = {}) {
    if (!id) {
      throw new Error("id is required");
    }

    const resolved = this.resolveSync(id);
    if (resolved) {
      return this.getUrl(resolved.id, { download, recordId });
    }

    if (this._placeholders.has(id)) {
      return this._placeholders.get(id);
    }

    const cacheKey = `${id}|${recordId || ""}`;
    const cached = this._urlCache.get(cacheKey);
    if (cached && (!cached.expiresAt || cached.expiresAt - URL_REFRESH_MARGIN_MS > Date.now())) {
      return appendDownload(cached.url, download);
    }

    if (!this._urlRequests.has(cacheKey)) {
      const request = this.#mintViewUrl(id, recordId).finally(() => this._urlRequests.delete(cacheKey));
      this._urlRequests.set(cacheKey, request);
    }

    const minted = await this._urlRequests.get(cacheKey);
    this._urlCache.set(cacheKey, minted);
    return appendDownload(minted.url, download);
  }

  async #mintViewUrl(id, recordId) {
    const result = await this._http.request({
      method: "POST",
      path: VIEW_URL_PATH,
      body: { id, ...(recordId ? { record_id: recordId } : {}) },
    });

    return {
      url: `${this._http.baseUrl}${result?.path || `/storage/file/${id}`}`,
      expiresAt: result?.expires_at ? new Date(result.expires_at).getTime() : null,
    };
  }

  // Resolves a URL for each id (null when not viewable), for exporters and batch renders.
  async getUrls(ids, { recordId } = {}) {
    const unique = [...new Set((ids || []).filter(Boolean))];
    const entries = await Promise.all(unique.map(async (id) => [id, await this.getUrl(id, { recordId }).catch(() => null)]));
    return Object.fromEntries(entries);
  }

  #toListItem(entity) {
    return { ...entity };
  }

  // Children of a folder of the user's Files: `parentId`, a `path` relative to Files ("Photos/2026"),
  // or the Files root when neither is given. Resolves `{ folder, items }`.
  async list({ path, parentId } = {}) {
    let folderId = parentId;

    if (!folderId) {
      const folder = await this._http.request({
        path: path ? `${OBJECT_PATH}/path` : `${OBJECT_PATH}/user-root`,
        query: path ? { search: path, space: USER_FILES_SPACE } : undefined,
      });
      folderId = folder?.id;
    }

    const result = await this._http.request({ path: `${OBJECT_PATH}/parent`, query: { search: folderId } });
    return { folder: result?.folder || null, items: (result?.items || []).map((entity) => this.#toListItem(entity)) };
  }

  // Name search inside the user's Files. Each item carries `location` and `path_segments`.
  async search(text, { page, pageSize } = {}) {
    const searchText = String(text || "").trim();
    if (!searchText) {
      return { items: [] };
    }

    const result = await this._http.request({ path: `${OBJECT_PATH}/search`, query: { search: searchText, page, pageSize } });
    return {
      items: (result?.items || []).filter((entity) => entity.space === USER_FILES_SPACE).map((entity) => this.#toListItem(entity)),
    };
  }

  async usage() {
    const result = await this._http.request({ path: USAGE_PATH });
    return { total_bytes: result?.total_bytes ?? 0, by_app: result?.by_app || [] };
  }

  dispose() {
    this._placeholders.forEach((url) => URL.revokeObjectURL(url));
    this._placeholders.clear();
    this._placeholderIds.clear();
    this._syncedListeners.clear();
  }

  toSdk() {
    return {
      upload: (file, options) => this.upload(file, options),
      getUrl: (id, options) => this.getUrl(id, options),
      getUrls: (ids, options) => this.getUrls(ids, options),
      shareToken: (id, options) => this.shareToken(id, options),
      usage: () => this.usage(),
      list: (options) => this.list(options),
      search: (text, options) => this.search(text, options),
      onUploadSynced: (callback) => this.onUploadSynced(callback),
      resolve: (localIdOrUrl, options) => this.resolve(localIdOrUrl, options),
      resolveUrl: (localIdOrUrl, options) => this.resolveUrl(localIdOrUrl, options),
      localIdFor: (localIdOrUrl) => this.localIdFor(localIdOrUrl),
      resolveSync: (localIdOrUrl) => this.resolveSync(localIdOrUrl),
    };
  }
}

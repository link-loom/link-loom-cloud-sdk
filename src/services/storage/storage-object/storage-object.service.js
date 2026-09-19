import BaseApi from "../../base/api.service";

const UPLOAD_TIMEOUT_MS = 600000;
const SHARE_TOKEN_TTL_MINUTES = 15;
const URL_REFRESH_MARGIN_MS = 60 * 1000;

/**
 * Storage object client — the file tree (folders + files) plus its commands. Reads go through the
 * queryselector GET (`roots`, `parent`, `workload`, `path`, `breadcrumb`, `tree`, `trash`, `usage`,
 * `user-root`, `recent`, `shared-with-me`, `id`); commands are the literal POSTs. One file per
 * upload request.
 *
 * Authentication is injected: `getHeaders()` returns the headers of the caller — the operator console
 * sends its api-key, apps and user surfaces send the identity headers (Authorization, organization,
 * app session).
 */
export default class StorageObjectService extends BaseApi {
  constructor(args) {
    super(args);

    this._getHeaders = args?.getHeaders;
    this._tokenUrls = new Map();
    this.serviceEndpoints = {
      baseUrl: args?.baseUrl || "",
      get: "/storage/object/",
      update: "/storage/object/",
      delete: "/storage/object/",
      upload: "/storage/object/upload",
      folder: "/storage/object/folder",
      move: "/storage/object/move",
      shareToken: "/storage/object/share-token",
      share: "/storage/object/share",
      unshare: "/storage/object/unshare",
      revokeLinks: "/storage/object/revoke-links",
      purge: "/storage/object/purge",
      restore: "/storage/object/restore",
      provisionWorkloadRoot: "/storage/workload-root/provision",
    };
  }

  request(settings = null) {
    return super.request({
      ...settings,
      headers: { ...(this._getHeaders ? this._getHeaders() : {}), ...(settings?.headers || {}) },
    });
  }

  async createFolder(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.folder });
  }

  async move(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.move });
  }

  async shareToken(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.shareToken });
  }

  /**
   * Replace who a file is shared with: `{ id, grants: [{ principal_type, principal_id, role }] }`.
   * The whole list travels, not a delta. Owner only — the backend refuses anybody else.
   */
  async share(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.share });
  }

  /**
   * Take one principal off a file (`{ id, principal_id }`) or clear the list (`{ id, all: true }`).
   * Links minted through the removed grant stop working at once; every other link survives.
   */
  async unshare(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.unshare });
  }

  async revokeLinks(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.revokeLinks });
  }

  async purge(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.purge });
  }

  async restore(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.restore });
  }

  async provisionWorkloadRoot(data) {
    return super.post(data, { endpoint: this.serviceEndpoints.provisionWorkloadRoot });
  }

  /**
   * @param {File} file The browser File to upload.
   * @param {object} destination `{ parent_id }`, `{ workload_id, workload_slug }` and/or `{ space }`.
   */
  async upload(file, destination = {}) {
    const form = new FormData();

    Object.entries(destination).forEach(([key, value]) => {
      if (value) {
        form.append(key, value);
      }
    });
    form.append("file", file, file.name);

    return super.post(form, { endpoint: this.serviceEndpoints.upload, timeout: UPLOAD_TIMEOUT_MS });
  }

  /**
   * A URL an <img>, <video> or new tab can load without headers: the canonical URL for public
   * objects, otherwise a short-lived share-token URL cached until shortly before it expires.
   * Resolves null when no token could be minted.
   */
  async getFileUrl(objectId, { filename, download, visibility } = {}) {
    if (visibility === "public") {
      return this.fileUrl(objectId, { filename, download });
    }

    const cached = this._tokenUrls.get(objectId);
    if (cached && cached.expiresAt - URL_REFRESH_MARGIN_MS > Date.now()) {
      return this.fileUrl(objectId, { filename, download, token: cached.token });
    }

    const response = await this.shareToken({ id: objectId, ttl_minutes: SHARE_TOKEN_TTL_MINUTES });
    const token = response?.success ? response.result?.token : null;

    if (!token) {
      return null;
    }

    const expiresAt = response.result.expires_at
      ? new Date(response.result.expires_at).getTime()
      : Date.now() + SHARE_TOKEN_TTL_MINUTES * 60 * 1000;
    this._tokenUrls.set(objectId, { token, expiresAt });
    return this.fileUrl(objectId, { filename, download, token });
  }

  // The canonical file URL is always the backend's `/storage/file/:id`; the blob provider is never exposed.
  fileUrl(objectId, { token, filename, download } = {}) {
    const namePart = filename ? `/${encodeURIComponent(filename)}` : "";
    const query = [];

    if (token) {
      query.push(`token=${token}`);
    }
    if (download) {
      query.push("download=1");
    }

    return `${this.serviceEndpoints.baseUrl}/storage/file/${objectId}${namePart}${query.length ? `?${query.join("&")}` : ""}`;
  }
}

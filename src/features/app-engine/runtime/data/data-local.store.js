export const APP_DATA_ROOT_PREFIX = "stoneos:appdata:";

const CACHE_CAP_BYTES = 2 * 1024 * 1024;
const SYNCED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RECORD_PREFIX = "cache:";
const LIST_PREFIX = "list:";
const OUTBOX_KEY = "outbox";
const META_KEY = "meta";

const DEFAULT_META = { idMap: {}, lastSyncAt: null, lastChangesAt: null, conflicts: 0, conflictIds: [], failures: [], collections: [] };

const isQuotaError = (error) =>
  error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED" || error?.code === 22;

export const buildAppDataNamespace = ({ veripassIdentity, organizationId, appSlug }) =>
  `${APP_DATA_ROOT_PREFIX}${veripassIdentity || "anonymous"}:${organizationId || "personal"}:${appSlug}:`;

export const clearAllAppData = (storage = globalThis.localStorage) => {
  if (!storage) {
    return;
  }

  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(APP_DATA_ROOT_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => storage.removeItem(key));
};

export default class AppDataLocalStore {
  constructor({ namespace, storage = globalThis.localStorage, now = () => Date.now() }) {
    this.namespace = namespace;
    this._storage = storage;
    this._now = now;
    this._memory = new Map();
  }

  #read(key) {
    const fullKey = `${this.namespace}${key}`;
    if (!this._storage) {
      return this._memory.get(fullKey) ?? null;
    }

    try {
      const raw = this._storage.getItem(fullKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Essential writes (outbox, meta) evict the cache on quota errors and retry; cache writes give up.
  #write(key, value, { essential = false } = {}) {
    const fullKey = `${this.namespace}${key}`;
    if (!this._storage) {
      this._memory.set(fullKey, value);
      return true;
    }

    const serialized = JSON.stringify(value);
    try {
      this._storage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      if (!isQuotaError(error)) {
        throw error;
      }
    }

    this.evictCache();
    if (!essential) {
      return false;
    }

    this._storage.setItem(fullKey, serialized);
    return true;
  }

  #remove(key) {
    const fullKey = `${this.namespace}${key}`;
    if (!this._storage) {
      this._memory.delete(fullKey);
      return;
    }
    this._storage.removeItem(fullKey);
  }

  #namespaceKeys() {
    if (!this._storage) {
      return [...this._memory.keys()].map((fullKey) => fullKey.slice(this.namespace.length));
    }

    const keys = [];
    for (let index = 0; index < this._storage.length; index += 1) {
      const fullKey = this._storage.key(index);
      if (fullKey?.startsWith(this.namespace)) {
        keys.push(fullKey.slice(this.namespace.length));
      }
    }
    return keys;
  }

  getRecordEntry(id) {
    return this.#read(`${RECORD_PREFIX}${id}`);
  }

  getRecord(id) {
    const entry = this.getRecordEntry(id);
    if (!entry) {
      return null;
    }
    entry.accessed_at = this._now();
    this.#write(`${RECORD_PREFIX}${id}`, entry);
    return entry.record;
  }

  putRecord(record, { synced = false } = {}) {
    if (!record?.id) {
      return;
    }
    const timestamp = this._now();
    this.#write(`${RECORD_PREFIX}${record.id}`, {
      record,
      synced_at: synced ? timestamp : null,
      accessed_at: timestamp,
    });
  }

  removeRecord(id) {
    this.#remove(`${RECORD_PREFIX}${id}`);
  }

  listRecords() {
    return this.#namespaceKeys()
      .filter((key) => key.startsWith(RECORD_PREFIX))
      .map((key) => this.#read(key)?.record)
      .filter(Boolean);
  }

  getList(hash) {
    const entry = this.#read(`${LIST_PREFIX}${hash}`);
    if (!entry) {
      return null;
    }
    entry.accessed_at = this._now();
    this.#write(`${LIST_PREFIX}${hash}`, entry);
    return entry;
  }

  putList(hash, { ids, totalItems, collection }) {
    const timestamp = this._now();
    this.#write(`${LIST_PREFIX}${hash}`, { ids, totalItems, collection, synced_at: timestamp, accessed_at: timestamp });
  }

  replaceListId(previousId, nextId) {
    for (const key of this.#namespaceKeys().filter((candidate) => candidate.startsWith(LIST_PREFIX))) {
      const entry = this.#read(key);
      if (!entry?.ids?.includes(previousId)) {
        continue;
      }
      entry.ids = entry.ids.map((id) => (id === previousId ? nextId : id));
      this.#write(key, entry);
    }
  }

  removeListsForCollections(collections) {
    const targets = new Set(collections);
    for (const key of this.#namespaceKeys().filter((candidate) => candidate.startsWith(LIST_PREFIX))) {
      if (targets.has(this.#read(key)?.collection)) {
        this.#remove(key);
      }
    }
  }

  getOutbox() {
    return this.#read(OUTBOX_KEY) || [];
  }

  setOutbox(entries) {
    this.#write(OUTBOX_KEY, entries, { essential: true });
  }

  getMeta() {
    return { ...DEFAULT_META, ...(this.#read(META_KEY) || {}) };
  }

  updateMeta(patch) {
    const meta = { ...this.getMeta(), ...patch };
    this.#write(META_KEY, meta, { essential: true });
    return meta;
  }

  evictCache(protectedIds = new Set()) {
    for (const key of this.#namespaceKeys()) {
      if (key.startsWith(LIST_PREFIX)) {
        this.#remove(key);
        continue;
      }
      if (key.startsWith(RECORD_PREFIX) && !protectedIds.has(key.slice(RECORD_PREFIX.length))) {
        this.#remove(key);
      }
    }
  }

  // Expires synced entries older than the TTL, then evicts least recently used entries until the
  // namespace fits the cap. Records with queued mutations are never evicted.
  prune(protectedIds = new Set()) {
    const timestamp = this._now();
    const evictable = [];
    let totalBytes = 0;

    for (const key of this.#namespaceKeys()) {
      const fullKey = `${this.namespace}${key}`;
      const raw = this._storage ? this._storage.getItem(fullKey) || "" : JSON.stringify(this._memory.get(fullKey) || "");
      const isCacheKey = key.startsWith(RECORD_PREFIX) || key.startsWith(LIST_PREFIX);
      const isProtected = key.startsWith(RECORD_PREFIX) && protectedIds.has(key.slice(RECORD_PREFIX.length));

      if (!isCacheKey || isProtected) {
        totalBytes += (fullKey.length + raw.length) * 2;
        continue;
      }

      const entry = this.#read(key);
      if (!entry || (entry.synced_at && timestamp - entry.synced_at > SYNCED_TTL_MS)) {
        this.#remove(key);
        continue;
      }

      const bytes = (fullKey.length + raw.length) * 2;
      totalBytes += bytes;
      evictable.push({ key, bytes, accessedAt: entry.accessed_at || 0 });
    }

    evictable.sort((left, right) => left.accessedAt - right.accessedAt);
    for (const candidate of evictable) {
      if (totalBytes <= CACHE_CAP_BYTES) {
        break;
      }
      this.#remove(candidate.key);
      totalBytes -= candidate.bytes;
    }
  }
}

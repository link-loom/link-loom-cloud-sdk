export const UPLOAD_QUEUE_DATABASE = "stoneos-upload-queue";
const STORE_NAME = "uploads";
const DATABASE_VERSION = 1;

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDatabase = () => {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  const request = indexedDB.open(UPLOAD_QUEUE_DATABASE, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: "local_id" });
    }
  };
  return requestToPromise(request);
};

const withStore = async (mode, operation) => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction(STORE_NAME, mode);
    const completed = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    const result = await requestToPromise(operation(transaction.objectStore(STORE_NAME)));
    await completed;
    return result;
  } finally {
    database.close();
  }
};

export const enqueueUpload = (entry) => withStore("readwrite", (store) => store.put(entry));

export const listQueuedUploads = async (namespace) => {
  const entries = (await withStore("readonly", (store) => store.getAll())) || [];
  return entries.filter((entry) => entry.namespace === namespace).sort((left, right) => left.queued_at - right.queued_at);
};

export const removeQueuedUpload = (localId) => withStore("readwrite", (store) => store.delete(localId));

export const clearUploadQueue = () => {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve();
  }
  return requestToPromise(indexedDB.deleteDatabase(UPLOAD_QUEUE_DATABASE)).catch(() => undefined);
};

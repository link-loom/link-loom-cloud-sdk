import { clearAllAppData } from "./data-local.store";
import { clearVerifiedIdentities } from "../identity/identity-session";
import { clearUploadQueue } from "../files/upload-queue.store";

export const VERIPASS_LOGOUT_EVENT = "veripass::logout";

// Removes every locally persisted app record, outbox, verification mark and queued upload.
export const clearAppDataCache = () => {
  clearAllAppData(globalThis.localStorage);
  clearVerifiedIdentities();
  return clearUploadQueue();
};

if (typeof window !== "undefined") {
  window.addEventListener(VERIPASS_LOGOUT_EVENT, () => {
    clearAppDataCache();
  });
}

const STATUS_COPY_KEYS = {
  invoice: {
    open: "statusOpen",
    paid: "statusPaid",
    void: "statusVoid",
    uncollectible: "statusUncollectible",
  },
  subscription: {
    active: "statusActive",
    trialing: "statusTrialing",
    past_due: "statusPastDue",
    suspended: "statusSuspended",
    canceled: "statusCanceled",
    expired: "statusExpired",
  },
  attempt: {
    scheduled: "attemptScheduled",
    requested: "attemptRequested",
    succeeded: "attemptSucceeded",
    failed: "attemptFailed",
    canceled: "attemptCanceled",
  },
};

/**
 * The customer-facing name of a status in the surface's language. A status the copy does not know
 * yet shows the backend's own title.
 */
export function statusLabel(copy, kind, status) {
  return copy[STATUS_COPY_KEYS[kind]?.[status?.name]] || status?.title || "";
}

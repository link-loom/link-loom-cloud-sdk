import React from "react";

/**
 * Billing responses shaped exactly like `/monetization/billing/:queryselector`, and a fake
 * `MonetizationBillingService` that answers with them. Stories swap pieces to reach each state.
 */

const BOOTSTRAP_CSS =
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";

/**
 * The billing surfaces lay out with the host's Bootstrap utilities, so the stories load it the way a
 * host page would.
 */
export const withHostStyles = (Story) => {
  if (
    typeof document !== "undefined" &&
    !document.querySelector(`link[href="${BOOTSTRAP_CSS}"]`)
  ) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BOOTSTRAP_CSS;
    document.head.appendChild(link);
  }

  return <Story />;
};

const STATUS = {
  active: { id: 1, name: "active", title: "Active", color: "#2e7d32" },
  pastDue: { id: 4, name: "past_due", title: "Past due", color: "#f57c00" },
  suspended: { id: 5, name: "suspended", title: "Suspended", color: "#c62828" },
  open: { id: 4, name: "open", title: "Awaiting payment", color: "#f57c00" },
  paid: { id: 5, name: "paid", title: "Paid", color: "#2e7d32" },
  void: { id: 6, name: "void", title: "Void", color: "#607d8b" },
  attemptFailed: { id: 6, name: "failed", title: "Failed", color: "#c62828" },
  attemptScheduled: {
    id: 3,
    name: "scheduled",
    title: "Scheduled",
    color: "#90a4ae",
  },
};

const PERIOD = {
  start: "2026-08-18T03:14:43.420Z",
  end: "2026-09-18T03:14:43.420Z",
};
const USD = { currency: "USD", currency_exponent: 2 };

export const overview = {
  subject: {
    identity: "veripass-orgacme000000001",
    type: "organization",
    label: "Acme Corp",
  },
  product: {
    id: "pi-product-sample",
    slug: "sommatic",
    name: "Sommatic",
    brand: {},
  },
  subscription: {
    id: "mon-sub-sample",
    status: STATUS.pastDue,
    plan: { id: "mon-plan-pro", slug: "pro", name: "Pro", version: "1.0.2" },
    billing_cycle: "monthly",
    renewal_mode: "auto",
    price: { amount_minor: 1600, cycle: "monthly", ...USD },
    starts_at: "2026-04-18T03:14:43.420Z",
    current_period_start: PERIOD.start,
    current_period_end: PERIOD.end,
    trial_ends_at: "",
    is_trialing: false,
    cancel_at_period_end: false,
    canceled_at: "",
    pending_change: null,
    provisioned_by: "operator",
  },
  next_invoice: {
    expected_at: PERIOD.end,
    estimated_fixed_minor: 1600,
    estimated_usage_minor: 0,
    ...USD,
  },
  balances: [
    { amount_due_minor: 1600, open_count: 1, overdue_count: 1, ...USD },
  ],
  billing_profile: { id: "", complete: false },
  payment: { provider: "", status: "not_connected" },
};

export const usage = {
  subscription_id: "mon-sub-sample",
  plan_slug: "pro",
  plan_name: "Pro",
  plan_version: "1.0.2",
  status: STATUS.pastDue,
  billing_cycle: "monthly",
  current_period_start: PERIOD.start,
  current_period_end: PERIOD.end,
  price: { cycle: "monthly", amount_minor: 1600, is_default: true, ...USD },
  ...USD,
  metrics: [
    {
      metric: "workflow.runs",
      name: "Workflow runs",
      value_type: "quota",
      mode: "included",
      unit: "runs",
      limit: 25000,
      used: 26140,
      remaining: 0,
      overage_price: { amount_minor: 50, per_quantity: 100 },
      period_start: PERIOD.start,
      period_end: PERIOD.end,
      overage: {
        price: { amount_minor: 50, per_quantity: 100 },
        billable_quantity: 1140,
        estimated_amount_minor: 600,
      },
    },
    {
      metric: "seats",
      name: "Seats",
      value_type: "limit",
      mode: "included",
      unit: "seats",
      limit: 25,
      used: 21,
      remaining: 4,
      overage_price: null,
      period_start: null,
      period_end: null,
      overage: null,
    },
    {
      metric: "premium.invocations",
      name: "Premium invocations",
      value_type: "metered",
      mode: "addon",
      unit: "calls",
      limit: null,
      used: 342,
      remaining: null,
      overage_price: { amount_minor: 2, per_quantity: 1 },
      period_start: PERIOD.start,
      period_end: PERIOD.end,
      overage: null,
    },
  ],
};

const issuer = {
  legal_name: "Blackwood Stone Holdings, Inc.",
  email: "billing@blackwoodstone.com",
  tax_ids: [{ type: "ein", value: "12-3456789", country: "US", label: "" }],
  address: {
    line1: "1209 Orange St",
    city: "Wilmington",
    region: "DE",
    postal_code: "19801",
    country: "US",
  },
};

const invoice = (number, status, issuedAt, overrides = {}) => ({
  id: `mon-inv-${number}`,
  number,
  status,
  plan_name: "Pro",
  billing_cycle: "monthly",
  issued_at: issuedAt,
  due_at: issuedAt,
  period_start: PERIOD.start,
  period_end: PERIOD.end,
  subtotal_minor: 1600,
  tax_minor: 0,
  total_minor: 1600,
  amount_paid_minor: status.name === STATUS.paid.name ? 1600 : 0,
  amount_due_minor: status.name === STATUS.open.name ? 1600 : 0,
  issuer,
  bill_to: { legal_name: "Acme Corp", tax_ids: [], address: {} },
  lines: [
    {
      id: `line-${number}`,
      kind: "plan_fee",
      description: "Pro",
      quantity: 1,
      unit_amount_minor: 1600,
      per_quantity: 1,
      amount_minor: 1600,
      period_start: PERIOD.start,
      period_end: PERIOD.end,
    },
  ],
  attempts: [],
  ...USD,
  ...overrides,
});

export const invoices = [
  invoice("BSH-000009", STATUS.open, "2026-09-17T03:14:43.989Z", {
    attempts: [
      {
        attempt_number: 1,
        max_attempts: 3,
        status: STATUS.attemptFailed,
        scheduled_at: "2026-09-17T03:14:43.989Z",
        requested_at: "2026-09-17T03:14:44.358Z",
        completed_at: "2026-09-17T03:14:44.360Z",
        failure_code: "no_payment_method",
      },
      {
        attempt_number: 2,
        max_attempts: 3,
        status: STATUS.attemptScheduled,
        scheduled_at: "2026-09-19T03:14:44.366Z",
        requested_at: "",
        completed_at: "",
        failure_code: "",
      },
    ],
  }),
  invoice("BSH-000008", STATUS.paid, "2026-08-18T03:14:43.989Z"),
  invoice("BSH-000006", STATUS.void, "2026-07-18T03:14:43.989Z"),
  invoice("BSH-000005", STATUS.paid, "2026-07-18T03:14:43.989Z"),
];

export const profile = {
  id: "mon-billprof-sample",
  owner_identity: "veripass-orgacme000000001",
  owner_type: "organization",
  legal_name: "Acme Corp S.A.S.",
  email: "billing@acme.example",
  phone: "",
  tax_ids: [{ type: "nit", value: "900.123.456-7", country: "CO", label: "" }],
  address: {
    line1: "Cra 7 #71-21",
    line2: "Oficina 802",
    city: "Bogotá D.C.",
    region: "",
    postal_code: "110231",
    country: "CO",
  },
  preferred_locale: "es",
};

export const access = {
  allowed: { allowed: true, status: STATUS.active, reasons: [] },
  pastDue: {
    allowed: true,
    status: STATUS.pastDue,
    reasons: [
      {
        code: "payment_overdue",
        invoice_id: "mon-inv-BSH-000009",
        invoice_number: "BSH-000009",
      },
    ],
  },
  quotaExceeded: {
    allowed: true,
    status: STATUS.active,
    reasons: [
      {
        code: "quota_exceeded",
        metric: "workflow.runs",
        name: "Workflow runs",
        limit: 25000,
        used: 25000,
      },
    ],
  },
  suspended: {
    allowed: false,
    status: STATUS.suspended,
    reasons: [
      {
        code: "payment_overdue",
        invoice_id: "mon-inv-BSH-000002",
        invoice_number: "BSH-000002",
      },
    ],
  },
};

export { STATUS };

/**
 * A stand-in for `MonetizationBillingService`. `failure` answers every read with that envelope, the
 * way the real service reports a 401 or a network problem.
 */
export function createBillingService({
  overview: overviewResult = overview,
  usage: usageResult = usage,
  invoices: invoiceItems = invoices,
  profile: profileResult = null,
  access: accessResult = access.allowed,
  failure = null,
  delayMs = 300,
} = {}) {
  const answer = (result) =>
    new Promise((resolve) =>
      setTimeout(
        () => resolve(failure || { success: true, status: 200, result }),
        delayMs,
      ),
    );

  return {
    getByParameters: ({ queryselector, id, page = 1, pageSize = 10 }) => {
      switch (queryselector) {
        case "overview":
          return answer(overviewResult);
        case "usage":
          return answer(usageResult);
        case "invoices":
          return answer({
            items: invoiceItems.slice((page - 1) * pageSize, page * pageSize),
            totalItems: invoiceItems.length,
            currentPage: page,
            pageSize,
          });
        case "invoice":
          return answer(invoiceItems.find((item) => item.id === id) || null);
        case "profile":
          return answer({ profile: profileResult });
        case "access":
          return answer(accessResult);
        default:
          return answer(null);
      }
    },
    saveProfile: ({ profile: nextProfile }) =>
      answer({ ...profileResult, ...nextProfile }),
    getDocument: ({ id, format }) =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: true,
              blob: new Blob(
                [`Sample ${format || "csv"} document for ${id || "invoices"}`],
                { type: "text/plain" },
              ),
              filename: `${id || "invoices"}.${format === "pdf" ? "pdf" : format === "html" ? "html" : "csv"}`,
            }),
          delayMs,
        ),
      ),
  };
}

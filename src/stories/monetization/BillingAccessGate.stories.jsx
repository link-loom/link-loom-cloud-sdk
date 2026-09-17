import React from "react";

import BillingAccessGate from "../../monetization/components/billing/access-gate/BillingAccessGate.component";
import {
  access,
  createBillingService,
  withHostStyles,
} from "./billing.fixtures";

export default {
  title: "Monetization/Billing/BillingAccessGate",
  component: BillingAccessGate,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  globals: {
    theme: "light",
  },
  decorators: [withHostStyles],
  argTypes: {
    locale: { control: "select", options: ["en", "es"] },
    isBillingRoute: { control: "boolean" },
  },
};

const PlatformPage = () => (
  <section
    style={{ padding: 24, border: "1px dashed #d1d5db", borderRadius: 12 }}
  >
    <h4 style={{ marginTop: 0 }}>Platform page</h4>
    <p style={{ marginBottom: 0 }}>
      Whatever the host renders inside its authenticated layout.
    </p>
  </section>
);

const baseArgs = {
  product: "sommatic",
  onAction: (event) => console.log("Billing action", event),
  children: <PlatformPage />,
};

export const Allowed = {
  args: {
    ...baseArgs,
    service: createBillingService({ access: access.allowed }),
  },
};

export const PastDueBanner = {
  args: {
    ...baseArgs,
    service: createBillingService({ access: access.pastDue }),
  },
};

export const QuotaExceededBanner = {
  args: {
    ...baseArgs,
    service: createBillingService({ access: access.quotaExceeded }),
  },
};

export const Suspended = {
  args: {
    ...baseArgs,
    service: createBillingService({ access: access.suspended }),
  },
};

export const SuspendedOnBillingRoute = {
  args: {
    ...baseArgs,
    isBillingRoute: true,
    service: createBillingService({ access: access.suspended }),
  },
};

export const SuspendedInSpanish = {
  args: {
    ...baseArgs,
    locale: "es",
    service: createBillingService({ access: access.suspended }),
  },
};

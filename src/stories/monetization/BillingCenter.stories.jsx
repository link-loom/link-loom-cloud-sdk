import React from "react";

import BillingCenter from "../../monetization/components/billing/center/BillingCenter.component";
import {
  createBillingService,
  invoices,
  overview,
  profile,
  STATUS,
  usage,
  withHostStyles,
} from "./billing.fixtures";

export default {
  title: "Monetization/Billing/BillingCenter",
  component: BillingCenter,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  globals: {
    theme: "light",
  },
  argTypes: {
    locale: { control: "select", options: ["en", "es"] },
    theme: { control: "object" },
    labels: { control: "object" },
  },
  decorators: [
    withHostStyles,
    (Story) => (
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: 24,
          background: "#fff",
          borderRadius: 12,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

const paidInvoices = invoices.filter(
  (item) => item.status.name !== STATUS.open.name,
);

export const PastDue = {
  args: {
    service: createBillingService({ profile }),
    product: "sommatic",
    onAction: (event) => console.log("Billing action", event),
  },
};

export const UpToDate = {
  args: {
    service: createBillingService({
      overview: {
        ...overview,
        subscription: { ...overview.subscription, status: STATUS.active },
        balances: [],
        billing_profile: { id: profile.id, complete: true },
      },
      usage: {
        ...usage,
        status: STATUS.active,
        metrics: usage.metrics.map((metric) => ({
          ...metric,
          used: Math.min(metric.used, metric.limit ?? metric.used),
          overage: null,
        })),
      },
      invoices: paidInvoices,
      profile,
    }),
    product: "sommatic",
  },
};

export const NoBillingDetailsYet = {
  args: {
    service: createBillingService(),
    product: "sommatic",
  },
};

export const NoPlanYet = {
  args: {
    service: createBillingService({
      overview: {
        ...overview,
        subscription: null,
        next_invoice: null,
        balances: [],
      },
      usage: { metrics: [] },
      invoices: [],
    }),
    product: "sommatic",
  },
};

export const Spanish = {
  args: {
    service: createBillingService({ profile }),
    product: "mi-campus",
    locale: "es",
  },
};

export const SessionExpired = {
  args: {
    service: createBillingService({
      failure: {
        success: false,
        status: 401,
        message: "Unauthorized",
        result: null,
      },
    }),
    product: "sommatic",
  },
};

export const CannotLoad = {
  args: {
    service: createBillingService({
      failure: {
        success: false,
        status: 0,
        message: "Network Error",
        result: null,
      },
    }),
    product: "sommatic",
  },
};

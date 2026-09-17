import React, { useState } from "react";
import { Divider } from "@mui/material";

import useBilling from "../../../hooks/use-billing";
import useBillingProfile from "../../../hooks/use-billing-profile";
import useInvoices from "../../../hooks/use-invoices";
import {
  BILLING_CENTER_DEFAULTS,
  BILLING_CENTER_TRANSLATIONS,
  MONETIZATION_THEME,
  localizeDefaults,
  mergeDefaults,
} from "../../../defaults/monetization.defaults";

import BillingInvoiceDrawer from "./BillingInvoiceDrawer.component";
import BillingInvoicesSection from "./BillingInvoicesSection.component";
import BillingPaymentSection from "./BillingPaymentSection.component";
import BillingProfileSection from "./BillingProfileSection.component";
import BillingSubscriptionSection from "./BillingSubscriptionSection.component";
import BillingUsageSection from "./BillingUsageSection.component";
import { openBlob, saveBlob } from "./shared/document.util";

/**
 * BillingCenter — a customer's whole billing page: plan, usage, payment, billing details, invoices.
 *
 * The host injects `service` (a MonetizationBillingService carrying the customer's identity headers).
 * Nothing here names a subject: the backend resolves whose billing it is from that identity.
 *
 * Section ids (`${sectionIdPrefix}-subscription-details`, `-usage-metering`, `-payment-info`,
 * `-billing-address`, `-invoice-history`) are stable so an assistant or command surface can scroll to
 * a named section.
 */
export const BILLING_SECTION_IDS = {
  subscription: "subscription-details",
  usage: "usage-metering",
  payment: "payment-info",
  profile: "billing-address",
  invoices: "invoice-history",
};

function BillingCenterComponent({
  service,
  product,
  sections = ["subscription", "usage", "payment", "profile", "invoices"],
  sectionIdPrefix = "billing-section",
  locale = "en",
  labels,
  theme,
  invoicesPageSize = 10,
  renderChart,
  onAction,
  className = "",
}) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const billing = useBilling({ service, product });
  const profileState = useBillingProfile({
    service,
    enabled: sections.includes("profile"),
  });
  const invoicesState = useInvoices({
    service,
    product,
    locale,
    pageSize: invoicesPageSize,
    enabled: sections.includes("invoices"),
  });

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [openInvoice, setOpenInvoice] = useState(null);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const copy = mergeDefaults(
    localizeDefaults(
      BILLING_CENTER_DEFAULTS,
      BILLING_CENTER_TRANSLATIONS,
      locale,
    ),
    labels,
  );
  const palette = mergeDefaults(MONETIZATION_THEME, theme);
  const visibleSections = sections.filter((key) => BILLING_SECTION_IDS[key]);
  const sessionError = [
    billing.overviewError,
    invoicesState.error,
    profileState.error,
  ].find((error) => error?.status === 401);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  React.useEffect(() => {
    if (sessionError) {
      onAction?.({ action: "session-expired", error: sessionError });
    }
  }, [sessionError]);

  const handleOpen = async (invoice) => {
    setOpenInvoice(invoice);
    setIsDrawerOpen(true);
    setIsInvoiceLoading(true);

    const response = await invoicesState.loadInvoice(invoice.id);

    if (response?.success) {
      setOpenInvoice(response.result);
    }

    setIsInvoiceLoading(false);
    onAction?.({ action: "invoice-opened", invoice });
  };

  const handleView = async (invoice) => {
    const response = await invoicesState.view(invoice);

    if (response?.success) {
      openBlob(response.blob);
    }
  };

  const handleDownload = async (invoice) => {
    const response = await invoicesState.download(invoice);

    if (response?.success) {
      saveBlob(response.blob, response.filename || `${invoice.number}.pdf`);
      onAction?.({ action: "invoice-downloaded", invoice });
    }
  };

  const handleExport = async () => {
    const response = await invoicesState.exportCsv();

    if (response?.success) {
      saveBlob(response.blob, response.filename || "invoices.csv");
      onAction?.({ action: "invoices-exported", format: "csv" });
    }
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const renderSection = (key) => {
    switch (key) {
      case "subscription":
        return (
          <BillingSubscriptionSection
            overview={billing.overview}
            error={billing.overviewError}
            isLoading={billing.isLoading}
            copy={copy}
            palette={palette}
            locale={locale}
            onAction={onAction}
            onRetry={billing.refresh}
          />
        );
      case "usage":
        return (
          <BillingUsageSection
            usage={billing.usage}
            error={billing.usageError}
            isLoading={billing.isLoading}
            copy={copy}
            palette={palette}
            locale={locale}
            labels={labels}
            theme={theme}
            renderChart={renderChart}
            onRetry={billing.refresh}
          />
        );
      case "payment":
        return (
          <BillingPaymentSection
            copy={copy}
            palette={palette}
            onAction={onAction}
          />
        );
      case "profile":
        return (
          <BillingProfileSection
            profileState={profileState}
            copy={copy}
            palette={palette}
            locale={locale}
            onAction={onAction}
          />
        );
      case "invoices":
        return (
          <BillingInvoicesSection
            invoicesState={invoicesState}
            copy={copy}
            palette={palette}
            locale={locale}
            onOpen={handleOpen}
            onView={handleView}
            onDownload={handleDownload}
            onExport={handleExport}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className={`d-flex flex-column ${className}`}>
      {visibleSections.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <Divider sx={{ my: 3, borderColor: palette.border }} />}
          <section
            id={`${sectionIdPrefix}-${BILLING_SECTION_IDS[key]}`}
            style={{ scrollMarginTop: 96 }}
          >
            {renderSection(key)}
          </section>
        </React.Fragment>
      ))}

      <BillingInvoiceDrawer
        invoice={openInvoice}
        isLoading={isInvoiceLoading}
        isOpen={isDrawerOpen}
        copy={copy}
        palette={palette}
        locale={locale}
        busyDocument={invoicesState.busyDocument}
        onClose={() => setIsDrawerOpen(false)}
        onView={handleView}
        onDownload={handleDownload}
      />
    </section>
  );
}

export default BillingCenterComponent;

import React from "react";
import { Alert, Button, Typography } from "@mui/material";
import { LockOutlined as LockIcon } from "@mui/icons-material";

import useBillingAccess from "../../../hooks/use-billing-access";
import { fillTemplate } from "../../../format/value-formatter";
import {
  BILLING_ACCESS_DEFAULTS,
  BILLING_ACCESS_TRANSLATIONS,
  MONETIZATION_THEME,
  localizeDefaults,
  mergeDefaults,
} from "../../../defaults/monetization.defaults";

/**
 * BillingAccessGate — wraps a platform's authenticated layout and applies the billing verdict.
 *
 * A suspended account sees a pause screen instead of the platform; `isBillingRoute` keeps the billing
 * page reachable so the customer can pay. Past-due accounts and used-up hard quotas get a banner and
 * keep working. If billing cannot answer, the platform stays open.
 *
 * `blockedSlot` renders next to the pause screen, for whatever a host's pages normally mount — e.g. a
 * "page loaded" signal that dismisses a global loading overlay.
 */
function BillingAccessGateComponent({
  service,
  product,
  isBillingRoute = false,
  refreshIntervalMs,
  locale = "en",
  labels,
  theme,
  onAction,
  blockedSlot = null,
  children,
}) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const access = useBillingAccess({ service, product, refreshIntervalMs });

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const copy = mergeDefaults(
    localizeDefaults(
      BILLING_ACCESS_DEFAULTS,
      BILLING_ACCESS_TRANSLATIONS,
      locale,
    ),
    labels,
  );
  const palette = mergeDefaults(MONETIZATION_THEME, theme);
  const reasons = access.reasons || [];
  const overdue = reasons.find((reason) => reason.code === "payment_overdue");
  const exhausted = reasons.find((reason) => reason.code === "quota_exceeded");
  const goToBilling = (reason) =>
    onAction?.({ action: "open-billing", reason });

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (!access.allowed && !isBillingRoute) {
    return (
      <section
        className="d-flex flex-column align-items-center justify-content-center text-center p-4"
        style={{ minHeight: "60vh" }}
      >
        <LockIcon sx={{ fontSize: 40, color: palette.textMuted }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: palette.textPrimary, mt: 2 }}
        >
          {copy.blockedTitle}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: palette.textSecondary, mt: 1, maxWidth: 480 }}
        >
          {copy.blockedBody}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          onClick={() => goToBilling(overdue)}
          sx={{
            mt: 3,
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: palette.brandPrimary,
            "&:hover": { backgroundColor: palette.brandPrimaryDark },
          }}
        >
          {copy.blockedAction}
        </Button>
        {blockedSlot}
      </section>
    );
  }

  const banner = overdue
    ? { severity: "warning", text: copy.pastDueBanner, reason: overdue }
    : exhausted
      ? {
          severity: "info",
          text: fillTemplate(copy.quotaBanner, {
            name: exhausted.name || exhausted.metric,
          }),
          reason: exhausted,
        }
      : null;

  return (
    <>
      {banner && !isBillingRoute && (
        <Alert
          severity={banner.severity}
          sx={{ borderRadius: 0 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => goToBilling(banner.reason)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {copy.bannerAction}
            </Button>
          }
        >
          {banner.text}
        </Alert>
      )}
      {children}
    </>
  );
}

export default BillingAccessGateComponent;

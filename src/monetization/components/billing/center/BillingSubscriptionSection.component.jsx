import React from "react";
import { Alert, Button, Chip, Typography } from "@mui/material";

import {
  fillTemplate,
  formatDate,
  formatMoney,
} from "../../../format/value-formatter";
import BillingMicroLabel from "./shared/BillingMicroLabel.component";
import BillingSectionHeader from "./shared/BillingSectionHeader.component";
import BillingSectionState from "./shared/BillingSectionState.component";
import BillingStatusChip from "./shared/BillingStatusChip.component";
import { statusLabel } from "./shared/status-label.util";

const CYCLE_LABELS = {
  monthly: "cycleMonthly",
  annual: "cycleAnnual",
  "one-time": "cycleOneTime",
  custom: "cycleCustom",
};

function BillingSubscriptionSectionComponent({
  overview,
  error,
  isLoading,
  copy,
  palette,
  locale,
  onAction,
  onRetry,
}) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const subscription = overview?.subscription;
  const price = subscription?.price;
  const isFree = price && !price.amount_minor;
  const money = (amountMinor) =>
    formatMoney(amountMinor, price?.currency, price?.currency_exponent, {
      locale,
    });
  const cycleLabel =
    copy[CYCLE_LABELS[subscription?.billing_cycle]] ||
    subscription?.billing_cycle;
  const renews =
    subscription?.renewal_mode === "auto" &&
    !subscription?.cancel_at_period_end;

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const notices = () => {
    if (!subscription) {
      return [];
    }

    const list = [];
    const status = subscription.status?.name;

    if (status === "suspended") {
      list.push({ severity: "error", text: copy.suspendedNotice });
    }

    if (status === "past_due") {
      list.push({ severity: "warning", text: copy.pastDueNotice });
    }

    if (subscription.is_trialing && subscription.trial_ends_at) {
      list.push({
        severity: "info",
        text: fillTemplate(copy.trialNotice, {
          date: formatDate(subscription.trial_ends_at, { locale }),
        }),
      });
    }

    if (subscription.cancel_at_period_end) {
      list.push({
        severity: "info",
        text: fillTemplate(copy.cancelNotice, {
          date: formatDate(subscription.current_period_end, { locale }),
        }),
      });
    }

    if (subscription.pending_change) {
      list.push({
        severity: "info",
        text: fillTemplate(copy.pendingChangeNotice, {
          plan: subscription.pending_change.plan_name,
          date: formatDate(subscription.pending_change.takes_effect_at, {
            locale,
          }),
        }),
      });
    }

    return list;
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const kpi = (label, content) => (
    <article className="col-6 col-md">
      <BillingMicroLabel palette={palette}>{label}</BillingMicroLabel>
      <div className="mt-1">{content}</div>
    </article>
  );

  const strong = (text) => (
    <Typography
      variant="h6"
      sx={{ fontWeight: 700, color: palette.textPrimary, fontSize: "1.05rem" }}
    >
      {text || "—"}
    </Typography>
  );

  return (
    <>
      <BillingSectionHeader
        title={copy.subscriptionTitle}
        description={copy.subscriptionDescription}
        palette={palette}
        action={
          <div className="d-flex align-items-center gap-2">
            {subscription?.status && (
              <BillingStatusChip
                name={subscription.status.name}
                label={statusLabel(copy, "subscription", subscription.status)}
                palette={palette}
              />
            )}
            <Button
              size="small"
              onClick={() => onAction?.({ action: "change-plan", overview })}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: palette.brandPrimary,
              }}
            >
              {copy.changePlanLabel}
            </Button>
          </div>
        }
      />

      <BillingSectionState
        isLoading={isLoading}
        error={error}
        isEmpty={!subscription}
        emptyMessage={`${copy.noPlanTitle}. ${copy.noPlanBody}`}
        copy={copy}
        palette={palette}
        onRetry={onRetry}
        skeletonRows={1}
      >
        <div className="row g-3">
          {kpi(
            copy.planPriceLabel,
            strong(isFree ? copy.freeLabel : money(price?.amount_minor)),
          )}
          {kpi(
            copy.yourPlanLabel,
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {strong(subscription?.plan?.name)}
              {price && !isFree && (
                <Chip
                  label={`${money(price.amount_minor)} / ${cycleLabel}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    borderColor: palette.border,
                    color: palette.textSecondary,
                  }}
                />
              )}
            </div>,
          )}
          {kpi(
            copy.nextInvoiceLabel,
            strong(
              renews
                ? formatDate(overview?.next_invoice?.expected_at, { locale })
                : null,
            ),
          )}
          {kpi(copy.cycleLabel, strong(cycleLabel))}
          {kpi(
            copy.autoRenewalLabel,
            strong(renews ? copy.onLabel : copy.offLabel),
          )}
        </div>

        {notices().map((notice) => (
          <Alert
            key={notice.text}
            severity={notice.severity}
            sx={{ mt: 2, borderRadius: "8px" }}
          >
            {notice.text}
          </Alert>
        ))}
      </BillingSectionState>
    </>
  );
}

export default BillingSubscriptionSectionComponent;

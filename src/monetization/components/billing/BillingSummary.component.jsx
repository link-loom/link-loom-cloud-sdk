import React from "react";
import { Button, Chip, Divider, Skeleton, Typography } from "@mui/material";

import useUsage from "../../hooks/use-usage";
import { formatPrice, formatPeriod } from "../../format/value-formatter";
import {
  BILLING_SUMMARY_DEFAULTS,
  BILLING_SUMMARY_TRANSLATIONS,
  MONETIZATION_THEME,
  localizeDefaults,
  mergeDefaults,
} from "../../defaults/monetization.defaults";

import UsagePanel from "./UsagePanel.component";

/**
 * BillingSummary — what a subject is on, what they have used, and the periods behind them.
 *
 * There is no payment in this engine, so there is no card on file and no invoice here. What a host
 * gets is the plan, the allowances, and the period ledger.
 *
 * `sectionIdPrefix` puts a stable DOM id on each section. That exists so a host whose assistant or
 * command surface scrolls to a named section keeps working when this replaces a hand-written page —
 * without it, those handlers silently do nothing.
 */
const SECTION_IDS = {
  subscription: "subscription-details",
  usage: "usage-metering",
  history: "invoice-history",
};

function BillingSummaryComponent({
  baseUrl,
  apiKey,
  subject,
  product,
  sections = ["subscription", "usage", "history"],
  sectionIdPrefix = "billing-section",
  locale = "en",
  labels,
  theme,
  onAction,
  renderChart,
  className = "",
}) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { summary, metrics, history, hasSubscription, isLoading } = useUsage({
    baseUrl,
    apiKey,
    subject,
    product,
  });

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const copy = mergeDefaults(
    localizeDefaults(
      BILLING_SUMMARY_DEFAULTS,
      BILLING_SUMMARY_TRANSLATIONS,
      locale,
    ),
    labels,
  );
  const palette = mergeDefaults(MONETIZATION_THEME, theme);
  const sectionId = (key) => `${sectionIdPrefix}-${SECTION_IDS[key] || key}`;
  const shows = (key) => sections.includes(key);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (isLoading) {
    return (
      <section className={className}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton
          variant="rounded"
          height={120}
          sx={{ mt: 2, borderRadius: "12px" }}
        />
      </section>
    );
  }

  if (!hasSubscription) {
    return (
      <section
        className={`text-center py-5 ${className}`}
        id={sectionId("subscription")}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: palette.textPrimary }}
        >
          {copy.noSubscriptionTitle}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: palette.textSecondary, mt: 0.5 }}
        >
          {copy.noSubscriptionBody}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          onClick={() => onAction?.({ action: "change-plan" })}
          sx={{
            mt: 2,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "24px",
            backgroundColor: palette.brandPrimary,
            "&:hover": { backgroundColor: palette.brandPrimaryDark },
          }}
        >
          {copy.changePlanLabel}
        </Button>
      </section>
    );
  }

  return (
    <section className={`d-flex flex-column ${className}`}>
      {shows("subscription") && (
        <section id={sectionId("subscription")}>
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
            <div style={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: palette.textMuted,
                  display: "block",
                }}
              >
                {copy.planTitle}
              </Typography>
              <div className="d-flex align-items-center gap-2 mt-1">
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: palette.textPrimary }}
                >
                  {summary.plan_name || summary.plan_slug}
                </Typography>
                {summary.status?.title && (
                  <Chip
                    label={summary.status.title}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: `${summary.status.color || palette.success}1A`,
                      color: summary.status.color || palette.success,
                    }}
                  />
                )}
              </div>
              <Typography
                variant="body2"
                sx={{ color: palette.textSecondary, mt: 0.5 }}
              >
                {copy.periodLabel}:{" "}
                {formatPeriod(
                  summary.current_period_start,
                  summary.current_period_end,
                  {
                    locale,
                  },
                ) || "—"}
              </Typography>
            </div>

            <div className="text-end">
              {summary.price && (
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: palette.textPrimary }}
                >
                  {formatPrice(summary.price, { locale })}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: "0.8rem",
                      color: palette.textSecondary,
                      marginLeft: 6,
                    }}
                  >
                    {summary.price.currency}
                  </span>
                </Typography>
              )}
              <Button
                size="small"
                onClick={() => onAction?.({ action: "change-plan", summary })}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: palette.brandPrimary,
                  px: 0,
                }}
              >
                {copy.changePlanLabel}
              </Button>
            </div>
          </div>
        </section>
      )}

      {shows("usage") && !!metrics.length && (
        <>
          <Divider sx={{ my: 3 }} />
          <section id={sectionId("usage")}>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "0.65rem",
                fontWeight: 600,
                color: palette.textMuted,
                display: "block",
                mb: 2,
              }}
            >
              {copy.usageTitle}
            </Typography>
            <UsagePanel
              metrics={metrics}
              labels={labels}
              theme={theme}
              locale={locale}
              renderChart={renderChart}
            />
          </section>
        </>
      )}

      {shows("history") && (
        <>
          <Divider sx={{ my: 3 }} />
          <section id={sectionId("history")}>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "0.65rem",
                fontWeight: 600,
                color: palette.textMuted,
                display: "block",
                mb: 1.5,
              }}
            >
              {copy.historyTitle}
            </Typography>

            {!history.length ? (
              <Typography variant="body2" sx={{ color: palette.textMuted }}>
                {copy.emptyHistoryLabel}
              </Typography>
            ) : (
              <div className="d-flex flex-column">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="d-flex align-items-center justify-content-between py-2"
                    style={{ borderBottom: `1px solid ${palette.border}` }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: palette.textPrimary }}
                      >
                        {record.plan_name || record.plan_slug}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: palette.textMuted }}
                      >
                        {formatPeriod(record.period_start, record.period_end, {
                          locale,
                        })}
                      </Typography>
                    </div>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: palette.textPrimary }}
                    >
                      {formatPrice(record, { locale })} {record.currency}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default BillingSummaryComponent;

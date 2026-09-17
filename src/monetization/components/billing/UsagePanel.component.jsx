import React from "react";
import { LinearProgress, Typography } from "@mui/material";

import { formatUsage, usagePercentage } from "../../format/value-formatter";
import {
  BILLING_SUMMARY_DEFAULTS,
  BILLING_SUMMARY_TRANSLATIONS,
  MONETIZATION_THEME,
  localizeDefaults,
  mergeDefaults,
} from "../../defaults/monetization.defaults";

/**
 * What a subject has used this period, against what they are allowed.
 *
 * A metric with no ceiling shows the count and the word "unlimited" rather than a bar — a bar with
 * no end has nothing to fill, and drawing one that never moves reads as a bug.
 *
 * Takes a `renderChart` slot rather than importing a charting library: this SDK deliberately ships
 * with no dependencies of its own, and a bar chart is not worth breaking that for.
 */
function UsagePanelComponent({
  metrics = [],
  labels,
  theme,
  locale = "en",
  renderChart,
  className = "",
}) {
  const copy = mergeDefaults(
    localizeDefaults(
      BILLING_SUMMARY_DEFAULTS,
      BILLING_SUMMARY_TRANSLATIONS,
      locale,
    ),
    labels,
  );
  const palette = mergeDefaults(MONETIZATION_THEME, theme);

  if (!metrics.length) {
    return null;
  }

  const barColor = (percentage, metric) => {
    if (metric.used > (metric.limit ?? Infinity)) {
      return palette.error;
    }

    if (percentage !== null && percentage >= 90) {
      return palette.error;
    }

    if (percentage !== null && percentage >= 80) {
      return palette.warning;
    }

    return palette.success;
  };

  return (
    <section className={`d-flex flex-wrap gap-4 ${className}`}>
      {metrics.map((metric) => {
        const percentage = usagePercentage(metric);
        const isOver =
          Number.isFinite(metric.limit) &&
          Number(metric.used) > Number(metric.limit);
        const isClose = percentage !== null && percentage >= 80 && !isOver;
        // Pay-per-use grants have no ceiling on purpose: they are counted and billed, not capped.
        const isPayPerUse =
          metric.mode === "addon" || metric.value_type === "metered";

        return (
          <article
            key={metric.metric}
            style={{ flex: "1 1 220px", minWidth: 200 }}
          >
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
              {metric.name || metric.feature_slug || metric.metric}
            </Typography>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: palette.textPrimary, mt: 0.25 }}
            >
              {isPayPerUse
                ? `${new Intl.NumberFormat(locale).format(Number(metric.used) || 0)} ${metric.unit || ""}`.trim()
                : formatUsage(metric, {
                    locale,
                    unlimitedLabel: copy.unlimitedLabel,
                  })}
            </Typography>

            {percentage !== null ? (
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mt: 1,
                  backgroundColor: palette.border,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    backgroundColor: barColor(percentage, metric),
                  },
                }}
              />
            ) : (
              <Typography
                variant="caption"
                sx={{ color: palette.textMuted, display: "block", mt: 1 }}
              >
                {isPayPerUse ? copy.payPerUseLabel : copy.unlimitedLabel}
              </Typography>
            )}

            {(isOver || isClose) && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  color: isOver ? palette.error : palette.warning,
                  fontWeight: 600,
                }}
              >
                {isOver ? copy.overLimitLabel : copy.approachingLabel}
              </Typography>
            )}

            {renderChart ? renderChart(metric) : null}
          </article>
        );
      })}
    </section>
  );
}

export default UsagePanelComponent;

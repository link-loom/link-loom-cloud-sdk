import React from "react";
import { Typography } from "@mui/material";

import {
  fillTemplate,
  formatDateRange,
  formatMoney,
} from "../../../format/value-formatter";
import UsagePanel from "../UsagePanel.component";
import BillingSectionHeader from "./shared/BillingSectionHeader.component";
import BillingSectionState from "./shared/BillingSectionState.component";

function BillingUsageSectionComponent({
  usage,
  error,
  isLoading,
  copy,
  palette,
  locale,
  labels,
  theme,
  renderChart,
  onRetry,
}) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const metrics = usage?.metrics || [];
  const period = metrics.find((metric) => metric.period_start);
  const overages = metrics.filter(
    (metric) => metric.overage?.billable_quantity > 0,
  );
  const metered = metrics.filter((metric) => metric.value_type === "metered");

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      <BillingSectionHeader
        title={copy.usageTitle}
        description={
          period
            ? `${copy.usageDescription} ${formatDateRange(period.period_start, period.period_end, { locale })}`
            : copy.usageDescription
        }
        palette={palette}
      />

      <BillingSectionState
        isLoading={isLoading}
        error={error}
        isEmpty={!metrics.length}
        emptyMessage={copy.usageEmpty}
        copy={copy}
        palette={palette}
        onRetry={onRetry}
      >
        <UsagePanel
          metrics={metrics}
          labels={labels}
          theme={theme}
          locale={locale}
          renderChart={renderChart}
        />

        {overages.map((metric) => (
          <Typography
            key={`overage-${metric.metric}`}
            variant="body2"
            sx={{ color: palette.warningDark || palette.warning, mt: 1.5 }}
          >
            {metric.name}:{" "}
            {fillTemplate(copy.overageNote, {
              quantity: metric.overage.billable_quantity,
              amount: formatMoney(
                metric.overage.estimated_amount_minor,
                usage.currency,
                usage.currency_exponent,
                { locale },
              ),
            })}
          </Typography>
        ))}

        {metered.map((metric) => (
          <Typography
            key={`metered-${metric.metric}`}
            variant="caption"
            component="p"
            sx={{ color: palette.textMuted, mt: 1, mb: 0 }}
          >
            {metric.name}: {copy.meteredNote}
          </Typography>
        ))}
      </BillingSectionState>
    </>
  );
}

export default BillingUsageSectionComponent;

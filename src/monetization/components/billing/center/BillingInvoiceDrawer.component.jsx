import React from "react";
import {
  Button,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  CloseOutlined as CloseIcon,
  FileDownloadOutlined as DownloadIcon,
  OpenInNewOutlined as ViewIcon,
} from "@mui/icons-material";

import {
  fillTemplate,
  formatCountry,
  formatDate,
  formatDateRange,
  formatMoney,
} from "../../../format/value-formatter";
import BillingMicroLabel from "./shared/BillingMicroLabel.component";
import BillingStatusChip from "./shared/BillingStatusChip.component";
import { statusLabel } from "./shared/status-label.util";

function BillingInvoiceDrawerComponent({
  invoice,
  isLoading,
  isOpen,
  copy,
  palette,
  locale,
  busyDocument,
  onClose,
  onView,
  onDownload,
}) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const money = (amountMinor) =>
    formatMoney(amountMinor, invoice?.currency, invoice?.currency_exponent, {
      locale,
    });

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const party = (label, value) => (
    <article className="col-12 col-sm-6">
      <BillingMicroLabel palette={palette}>{label}</BillingMicroLabel>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: palette.textPrimary, mt: 0.5 }}
      >
        {value?.legal_name || "—"}
      </Typography>
      {[
        value?.address?.line1,
        value?.address?.line2,
        [
          value?.address?.city,
          value?.address?.region,
          value?.address?.postal_code,
        ]
          .filter(Boolean)
          .join(", "),
        formatCountry(value?.address?.country, { locale }),
        ...(value?.tax_ids || []).map(
          (taxId) =>
            `${(taxId.label || taxId.type).toUpperCase()} ${taxId.value}`,
        ),
        value?.email,
      ]
        .filter(Boolean)
        .map((line) => (
          <Typography
            key={line}
            variant="body2"
            sx={{ color: palette.textSecondary }}
          >
            {line}
          </Typography>
        ))}
    </article>
  );

  const total = (label, value, emphasize) => (
    <div className="d-flex justify-content-between">
      <Typography
        variant="body2"
        sx={{ color: palette.textSecondary, fontWeight: emphasize ? 700 : 400 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: palette.textPrimary, fontWeight: emphasize ? 700 : 500 }}
      >
        {value}
      </Typography>
    </div>
  );

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: "min(560px, 100vw)" } }}
    >
      <section className="d-flex flex-column h-100">
        <header
          className="d-flex align-items-center justify-content-between gap-2 p-3"
          style={{ borderBottom: `1px solid ${palette.border}` }}
        >
          <div
            className="d-flex align-items-center gap-2"
            style={{ minWidth: 0 }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: palette.textPrimary }}
            >
              {invoice?.number || copy.invoiceNumberLabel}
            </Typography>
            {invoice?.status && (
              <BillingStatusChip
                name={invoice.status.name}
                label={statusLabel(copy, "invoice", invoice.status)}
                palette={palette}
              />
            )}
          </div>
          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>

        <main className="flex-grow-1 p-3" style={{ overflowY: "auto" }}>
          {isLoading || !invoice ? (
            <div className="d-flex flex-column gap-2">
              <Skeleton variant="rounded" height={80} />
              <Skeleton variant="rounded" height={160} />
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div className="row g-3">
                <article className="col-6">
                  <BillingMicroLabel palette={palette}>
                    {copy.issuedLabel}
                  </BillingMicroLabel>
                  <Typography
                    variant="body2"
                    sx={{ color: palette.textPrimary }}
                  >
                    {formatDate(invoice.issued_at, { locale })}
                  </Typography>
                </article>
                <article className="col-6">
                  <BillingMicroLabel palette={palette}>
                    {copy.dueLabel}
                  </BillingMicroLabel>
                  <Typography
                    variant="body2"
                    sx={{ color: palette.textPrimary }}
                  >
                    {formatDate(invoice.due_at, { locale })}
                  </Typography>
                </article>
                <article className="col-12">
                  <BillingMicroLabel palette={palette}>
                    {copy.periodLabel}
                  </BillingMicroLabel>
                  <Typography
                    variant="body2"
                    sx={{ color: palette.textPrimary }}
                  >
                    {formatDateRange(invoice.period_start, invoice.period_end, {
                      locale,
                    })}{" "}
                    · {invoice.plan_name}
                  </Typography>
                </article>
              </div>

              <Divider />
              <div className="row g-3">
                {party(copy.fromLabel, invoice.issuer)}
                {party(copy.billToLabel, invoice.bill_to)}
              </div>
              <Typography variant="caption" sx={{ color: palette.textMuted }}>
                {copy.snapshotNote}
              </Typography>

              <Divider />
              <div className="d-flex flex-column gap-2">
                {(invoice.lines || []).map((line) => (
                  <div
                    key={line.id}
                    className="d-flex justify-content-between gap-3"
                  >
                    <div style={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: palette.textPrimary, fontWeight: 600 }}
                      >
                        {line.kind === "usage_overage"
                          ? `${line.description} — ${copy.lineUsage}`
                          : line.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: palette.textMuted }}
                      >
                        {formatDateRange(line.period_start, line.period_end, {
                          locale,
                        })}
                        {line.kind === "usage_overage"
                          ? ` · ${line.quantity} ${line.unit || ""}`
                          : ""}
                      </Typography>
                    </div>
                    <Typography
                      variant="body2"
                      sx={{ color: palette.textPrimary, whiteSpace: "nowrap" }}
                    >
                      {money(line.amount_minor)}
                    </Typography>
                  </div>
                ))}
              </div>

              <Divider />
              <div className="d-flex flex-column gap-1">
                {total(copy.subtotalLabel, money(invoice.subtotal_minor))}
                {invoice.tax_minor
                  ? total(copy.taxLabel, money(invoice.tax_minor))
                  : null}
                {total(copy.totalLabel, money(invoice.total_minor))}
                {total(copy.amountPaidLabel, money(invoice.amount_paid_minor))}
                {total(
                  copy.amountDueLabel,
                  money(invoice.amount_due_minor),
                  true,
                )}
              </div>

              {!!invoice.attempts?.length && (
                <>
                  <Divider />
                  <BillingMicroLabel palette={palette}>
                    {copy.attemptsTitle}
                  </BillingMicroLabel>
                  {invoice.attempts.map((attempt) => (
                    <div
                      key={attempt.attempt_number}
                      className="d-flex justify-content-between gap-2"
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: palette.textSecondary }}
                      >
                        {fillTemplate(copy.attemptLabel, {
                          number: attempt.attempt_number,
                          max: attempt.max_attempts,
                        })}
                        {" · "}
                        {attempt.status?.name === "scheduled"
                          ? fillTemplate(copy.nextAttemptLabel, {
                              date: formatDate(attempt.scheduled_at, {
                                locale,
                              }),
                            })
                          : formatDate(
                              attempt.completed_at || attempt.requested_at,
                              { locale },
                            )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: palette.textPrimary }}
                      >
                        {statusLabel(copy, "attempt", attempt.status)}
                      </Typography>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </main>

        {invoice && (
          <footer
            className="d-flex justify-content-end gap-2 p-3"
            style={{ borderTop: `1px solid ${palette.border}` }}
          >
            <Button
              startIcon={<ViewIcon fontSize="small" />}
              disabled={busyDocument === `view:${invoice.id}`}
              onClick={() => onView(invoice)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: palette.textPrimary,
              }}
            >
              {copy.viewLabel}
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<DownloadIcon fontSize="small" />}
              disabled={busyDocument === `pdf:${invoice.id}`}
              onClick={() => onDownload(invoice)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: palette.brandPrimary,
                "&:hover": { backgroundColor: palette.brandPrimaryDark },
              }}
            >
              {copy.downloadLabel}
            </Button>
          </footer>
        )}
      </section>
    </Drawer>
  );
}

export default BillingInvoiceDrawerComponent;

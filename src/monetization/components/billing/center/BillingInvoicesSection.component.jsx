import React from "react";
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FileDownloadOutlined as DownloadIcon,
  OpenInNewOutlined as ViewIcon,
} from "@mui/icons-material";

import { formatDate, formatMoney } from "../../../format/value-formatter";
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

function BillingInvoicesSectionComponent({
  invoicesState,
  copy,
  palette,
  locale,
  onOpen,
  onView,
  onDownload,
  onExport,
}) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const {
    items,
    total,
    page,
    pageSize,
    setPage,
    error,
    isLoading,
    refresh,
    busyDocument,
  } = invoicesState;
  const money = (invoice, amountMinor) =>
    formatMoney(amountMinor, invoice.currency, invoice.currency_exponent, {
      locale,
    });
  const headCell = {
    fontSize: "0.65rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: palette.textMuted,
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const actions = (invoice) => (
    <div
      className="d-flex justify-content-end"
      onClick={(event) => event.stopPropagation()}
    >
      <Tooltip title={copy.viewLabel}>
        <span>
          <IconButton
            size="small"
            disabled={busyDocument === `view:${invoice.id}`}
            onClick={() => onView(invoice)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={copy.downloadLabel}>
        <span>
          <IconButton
            size="small"
            disabled={busyDocument === `pdf:${invoice.id}`}
            onClick={() => onDownload(invoice)}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );

  return (
    <>
      <BillingSectionHeader
        title={copy.invoicesTitle}
        description={copy.invoicesDescription}
        palette={palette}
        action={
          <Button
            size="small"
            startIcon={<DownloadIcon fontSize="small" />}
            disabled={!total || busyDocument === "export"}
            onClick={onExport}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: palette.textPrimary,
            }}
          >
            {copy.exportLabel}
          </Button>
        }
      />

      <BillingSectionState
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length}
        emptyMessage={copy.invoicesEmpty}
        copy={copy}
        palette={palette}
        onRetry={refresh}
        skeletonRows={3}
      >
        <div className="d-none d-md-block">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>{copy.invoiceNumberLabel}</TableCell>
                <TableCell sx={headCell}>{copy.planLabel}</TableCell>
                <TableCell sx={headCell}>{copy.cycleLabel}</TableCell>
                <TableCell sx={headCell}>{copy.billingDateLabel}</TableCell>
                <TableCell sx={headCell} align="right">
                  {copy.amountLabel}
                </TableCell>
                <TableCell sx={headCell}>{copy.statusLabel}</TableCell>
                <TableCell sx={headCell} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  tabIndex={0}
                  onClick={() => onOpen(invoice)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && onOpen(invoice)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: palette.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {invoice.number}
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary }}>
                    {invoice.plan_name}
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary }}>
                    {copy[CYCLE_LABELS[invoice.billing_cycle]] ||
                      invoice.billing_cycle}
                  </TableCell>
                  <TableCell sx={{ color: palette.textSecondary }}>
                    {formatDate(invoice.issued_at, { locale })}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: palette.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {money(invoice, invoice.total_minor)}
                  </TableCell>
                  <TableCell>
                    <BillingStatusChip
                      name={invoice.status?.name}
                      label={statusLabel(copy, "invoice", invoice.status)}
                      palette={palette}
                    />
                  </TableCell>
                  <TableCell>{actions(invoice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="d-md-none d-flex flex-column">
          {items.map((invoice) => (
            <div
              key={invoice.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(invoice)}
              className="d-flex align-items-center justify-content-between gap-2 py-2"
              style={{
                borderBottom: `1px solid ${palette.border}`,
                cursor: "pointer",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: palette.textPrimary }}
                >
                  {invoice.number}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.textMuted }}>
                  {formatDate(invoice.issued_at, { locale })} ·{" "}
                  {invoice.plan_name}
                </Typography>
              </div>
              <div className="text-end">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: palette.textPrimary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {money(invoice, invoice.total_minor)}
                </Typography>
                <BillingStatusChip
                  name={invoice.status?.name}
                  label={statusLabel(copy, "invoice", invoice.status)}
                  palette={palette}
                />
              </div>
            </div>
          ))}
        </div>

        {total > pageSize && (
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[]}
            onPageChange={(event, nextPage) => setPage(nextPage + 1)}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} ${copy.paginationOf} ${count}`
            }
          />
        )}
      </BillingSectionState>
    </>
  );
}

export default BillingInvoicesSectionComponent;

import React, { useState } from "react";
import { Button, Chip, Typography } from "@mui/material";
import { AccountBalanceWalletOutlined as WalletIcon } from "@mui/icons-material";

import BillingSectionHeader from "./shared/BillingSectionHeader.component";

/**
 * How invoices get paid. Charging belongs to the payments provider; until it is connected this is an
 * honest placeholder — never a sample card.
 */
function BillingPaymentSectionComponent({ copy, palette, onAction }) {
  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [isNoticeVisible, setIsNoticeVisible] = useState(false);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <>
      <BillingSectionHeader
        title={copy.paymentTitle}
        description={copy.paymentDescription}
        palette={palette}
      />

      <div
        className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3"
        style={{
          background: palette.surfaceMuted,
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
        }}
      >
        <div
          className="d-flex align-items-start gap-3"
          style={{ minWidth: 0, flex: "1 1 16rem" }}
        >
          <WalletIcon sx={{ color: palette.textMuted }} />
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Typography
                variant="body2"
                sx={{ color: palette.textPrimary, fontWeight: 600 }}
              >
                {copy.paymentProviderNote}
              </Typography>
              <Chip
                label={copy.paymentComingSoon}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: palette.surface,
                  border: `1px solid ${palette.border}`,
                }}
              />
            </div>
            {isNoticeVisible && (
              <Typography
                variant="caption"
                sx={{ color: palette.textSecondary }}
              >
                {copy.paymentNotAvailable}
              </Typography>
            )}
          </div>
        </div>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setIsNoticeVisible(true);
            onAction?.({ action: "payment-method-requested" });
          }}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderColor: palette.border,
            color: palette.textPrimary,
          }}
        >
          {copy.addPaymentMethodLabel}
        </Button>
      </div>
    </>
  );
}

export default BillingPaymentSectionComponent;

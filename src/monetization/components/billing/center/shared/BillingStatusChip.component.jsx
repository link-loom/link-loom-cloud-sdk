import React from "react";
import { Chip } from "@mui/material";

/**
 * A soft chip whose tone follows what the customer should feel: paid is calm, awaiting payment asks
 * for attention, unpaid is urgent, void is neutral.
 */
const TONES = {
  paid: "success",
  active: "success",
  trialing: "success",
  open: "warning",
  past_due: "warning",
  uncollectible: "error",
  suspended: "error",
};

function BillingStatusChipComponent({ name, label, palette }) {
  const tone = TONES[name];
  const color = tone
    ? palette[`${tone}Dark`] || palette[tone]
    : palette.textSecondary;
  const background = tone ? `${palette[tone]}1F` : palette.surfaceMuted;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 600,
        color,
        bgcolor: background,
        border: `1px solid ${tone ? `${palette[tone]}33` : palette.border}`,
      }}
    />
  );
}

export default BillingStatusChipComponent;

import React from "react";
import { Typography } from "@mui/material";

function BillingMicroLabelComponent({ children, palette }) {
  return (
    <Typography
      variant="caption"
      component="p"
      sx={{
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontSize: "0.65rem",
        fontWeight: 600,
        color: palette.textMuted,
        m: 0,
      }}
    >
      {children}
    </Typography>
  );
}

export default BillingMicroLabelComponent;

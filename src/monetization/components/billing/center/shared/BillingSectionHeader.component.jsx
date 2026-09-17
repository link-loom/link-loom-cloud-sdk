import React from "react";
import { Typography } from "@mui/material";

function BillingSectionHeaderComponent({
  title,
  description,
  action,
  palette,
}) {
  return (
    <header className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
      <div style={{ minWidth: 0, flex: "1 1 14rem" }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: palette.textPrimary, lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: palette.textSecondary }}>
            {description}
          </Typography>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}

export default BillingSectionHeaderComponent;

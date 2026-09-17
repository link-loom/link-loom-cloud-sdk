import React from "react";
import { Button, Skeleton, Typography } from "@mui/material";

/**
 * Loading, empty and failed states for one section, so a problem in one part of the page never
 * blanks the rest.
 */
function BillingSectionStateComponent({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  emptyAction,
  copy,
  palette,
  onRetry,
  skeletonRows = 2,
  children,
}) {
  if (isLoading) {
    return (
      <div className="d-flex flex-column gap-2">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={44}
            sx={{ borderRadius: "8px" }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    const message =
      error.status === 401
        ? copy.sessionExpired
        : error.status === 403
          ? copy.forbidden
          : copy.loadError;

    return (
      <div
        className="d-flex align-items-center justify-content-between gap-3 p-3"
        style={{ background: palette.surfaceMuted, borderRadius: 8 }}
      >
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          {message}
        </Typography>
        {error.status !== 401 && error.status !== 403 && onRetry && (
          <Button
            size="small"
            onClick={onRetry}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: palette.brandPrimary,
            }}
          >
            {copy.retryLabel}
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="d-flex align-items-center justify-content-between gap-3 p-3"
        style={{
          border: `1px dashed ${palette.borderDashed}`,
          borderRadius: 8,
        }}
      >
        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
          {emptyMessage}
        </Typography>
        {emptyAction}
      </div>
    );
  }

  return children;
}

export default BillingSectionStateComponent;

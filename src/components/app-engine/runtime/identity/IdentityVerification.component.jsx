import React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import VeripassLogo from "./VeripassLogo.component";

const IDENTITY_COPY = {
  verifying: "Verifying your session with Veripass…",
  errorTitle: "We could not verify your session",
  retry: "Try again",
};

function IdentityVerification({ status, error, onRetry, minHeight, textColor, errorColor }) {
  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: `${minHeight}px`,
        gap: "16px",
        padding: "24px",
        color: textColor,
      }}
    >
      <VeripassLogo width={160} animated={!isError} />
      {!isError && <Typography sx={{ fontSize: "14px" }}>{IDENTITY_COPY.verifying}</Typography>}
      {isError && (
        <>
          <Typography sx={{ fontSize: "16px", fontWeight: 500, color: errorColor }}>{IDENTITY_COPY.errorTitle}</Typography>
          {error && <Typography sx={{ fontSize: "13px", textAlign: "center", maxWidth: "400px" }}>{error}</Typography>}
          <Button variant="outlined" size="small" onClick={onRetry}>
            {IDENTITY_COPY.retry}
          </Button>
        </>
      )}
    </div>
  );
}

export default IdentityVerification;

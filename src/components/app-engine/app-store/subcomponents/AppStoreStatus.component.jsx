import React from "react";
import { Box, Typography } from "@mui/material";
import { ErrorOutline as ErrorOutlineIcon, Refresh as RefreshIcon } from "@mui/icons-material";

import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import AppStorePillComponent from "./AppStorePill.component";

/**
 * The store's quiet states, drawn like My apps draws its own: a failure is an icon in a tinted circle,
 * a title and a retry pill; an empty list is one line of text with, at most, the one action that fills it.
 */
export function AppStoreErrorState({ title, retryLabel, onRetry }) {
  return (
    <Box role="alert" sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 0.75, py: 4, px: 2 }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          color: COLORS.danger,
          backgroundColor: COLORS.dangerTint,
          "& svg": { fontSize: 20 },
        }}
      >
        <ErrorOutlineIcon />
      </Box>
      <Typography component="p" sx={{ mt: 0.5, fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
        {title}
      </Typography>
      {onRetry && (
        <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.medium} startIcon={<RefreshIcon />} onClick={onRetry} sx={{ mt: 1 }}>
          {retryLabel}
        </AppStorePillComponent>
      )}
    </Box>
  );
}

export function AppStoreEmptyState({ text, hint, action }) {
  return (
    <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
      <Typography component="p" sx={{ fontSize: 15, color: COLORS.textSecondary }}>
        {text}
      </Typography>
      {hint && (
        <Typography component="p" sx={{ fontSize: 13, color: COLORS.textTertiary, mt: 0.5 }}>
          {hint}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

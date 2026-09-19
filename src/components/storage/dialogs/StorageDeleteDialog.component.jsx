import React, { useEffect, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { Delete as DeleteIcon, DeleteForever as DeleteForeverIcon, WarningAmber as WarningIcon } from "@mui/icons-material";

import { THEME_COLORS, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";
import { STORAGE_HELP } from "../defaults/storage.help";

/**
 * The single Delete entry point: one dialog, two clearly separated fates. Trash is the calm,
 * recoverable default; permanent deletion is visually loud and takes a second, explicit step
 * inside the dialog — no native confirm() popups anywhere in the flow.
 */
function StorageDeleteDialog({ items = [], mode = "both", startOnPurge = false, isBusy = false, onTrash, onPurge, onCancel }) {
  // Trash items have no "move to trash" left, and the delete-immediately shortcut asks for the
  // permanent step directly — both open on the confirmation instead of the two-fate chooser.
  const [isConfirmingPurge, setIsConfirmingPurge] = useState(mode === "purge-only" || startOnPurge);

  useEffect(() => {
    setIsConfirmingPurge(mode === "purge-only" || startOnPurge);
  }, [items, mode, startOnPurge]);

  const label = items.length === 1 ? `"${items[0]?.name}"` : `${items.length} items`;

  const optionBaseStyle = {
    border: `1px solid ${THEME_COLORS.borderMuted}`,
    borderRadius: THEME_RADII.md,
    cursor: isBusy ? "wait" : "pointer",
    transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease",
    background: THEME_COLORS.white,
  };

  return (
    <section style={{ padding: "1rem", width: "min(460px, 92vw)", fontFamily: "var(--stos-font-ui, inherit)", color: THEME_COLORS.textBody }}>
      <h5
        style={{ fontWeight: THEME_TYPE.weightStrong, marginBottom: "0.25rem", fontSize: THEME_TYPE.fontSize16, color: THEME_COLORS.textStrong, paddingRight: 36 }}
      >
        Delete {label}?
      </h5>
      <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, marginBottom: "1rem" }}>
        {mode === "purge-only"
          ? `${items.length === 1 ? "It is" : "They are"} already in the trash — this removes ${
              items.length === 1 ? "it" : "them"
            } for good.`
          : `Choose what happens to ${items.length === 1 ? "it" : "them"}.`}
      </p>

      {!isConfirmingPurge ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onTrash?.()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              textAlign: "left",
              width: "100%",
              ...optionBaseStyle,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = THEME_COLORS.brandPrimary;
              event.currentTarget.style.backgroundColor = tint(THEME_COLORS.brandPrimary, 4);
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = THEME_COLORS.borderMuted;
              event.currentTarget.style.backgroundColor = THEME_COLORS.white;
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: THEME_RADII.md,
                background: tint(THEME_COLORS.brandPrimary, 8),
              }}
            >
              {isBusy ? <CircularProgress size={18} /> : <DeleteIcon sx={{ fontSize: 20, color: THEME_COLORS.brandPrimary }} />}
            </span>
            <span>
              <span style={{ display: "block", fontWeight: 600, fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.textStrong }}>
                Move to trash
              </span>
              <span style={{ display: "block", fontSize: 12, color: THEME_COLORS.textSecondary }}>{STORAGE_HELP.softDelete}</span>
            </span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => setIsConfirmingPurge(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              textAlign: "left",
              width: "100%",
              ...optionBaseStyle,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = THEME_COLORS.errorDark;
              event.currentTarget.style.backgroundColor = tint(THEME_COLORS.error, 4);
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = THEME_COLORS.borderMuted;
              event.currentTarget.style.backgroundColor = THEME_COLORS.white;
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: THEME_RADII.md,
                background: tint(THEME_COLORS.error, 8),
              }}
            >
              <DeleteForeverIcon sx={{ fontSize: 20, color: THEME_COLORS.errorDark }} />
            </span>
            <span>
              <span style={{ display: "block", fontWeight: 600, fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.errorDark }}>
                Delete permanently
              </span>
              <span style={{ display: "block", fontSize: 12, color: THEME_COLORS.textSecondary }}>{STORAGE_HELP.purge}</span>
            </span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            padding: "1rem",
            border: `1px solid ${tint(THEME_COLORS.error, 40)}`,
            borderRadius: THEME_RADII.md,
            background: tint(THEME_COLORS.error, 4),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <WarningIcon sx={{ fontSize: 20, color: THEME_COLORS.errorDark }} />
            <span style={{ fontWeight: 600, fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.errorDark }}>This cannot be undone</span>
          </div>
          <p style={{ margin: "0", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textBody }}>
            {label} and everything inside will be destroyed, links to {items.length === 1 ? "it" : "them"} die immediately, and
            the stored bytes are freed.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
            {mode === "both" && (
              <Button
                size="small"
                disabled={isBusy}
                onClick={() => setIsConfirmingPurge(false)}
                sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary }}
              >
                Back
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              disabled={isBusy}
              onClick={() => onPurge?.()}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: THEME_TYPE.fontSize12,
                boxShadow: "none",
                backgroundColor: THEME_COLORS.errorDark,
                "&:hover": { backgroundColor: THEME_COLORS.errorDarker },
              }}
            >
              <DeleteForeverIcon sx={{ fontSize: 15, mr: 0.5 }} />
              Delete forever
            </Button>
          </div>
        </div>
      )}

      <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <Button
          onClick={onCancel}
          disabled={isBusy}
          sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.textSecondary }}
        >
          Cancel
        </Button>
      </footer>
    </section>
  );
}

export default StorageDeleteDialog;

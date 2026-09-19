import React, { useEffect, useState } from "react";
import { Button, TextField } from "@mui/material";
import { THEME_COLORS, THEME_TYPE } from "../defaults/storage.theme";

const TITLES = {
  "create-folder": "New folder",
  "create-root": "New storage",
  rename: "Rename",
};

const PLACEHOLDERS = {
  "create-folder": "Folder name",
  "create-root": "Storage name",
  rename: "New name",
};

// Same rules the backend enforces, checked here so the user gets feedback before the request.
const validateName = (raw) => {
  const name = (raw || "").trim();

  if (!name) return "Type a name.";
  if (name.length > 255) return "Keep it under 255 characters.";
  if (/[/\\]/.test(name)) return "Names cannot contain slashes.";
  if (name === "." || name === "..") return "That name is reserved.";
  return "";
};

function StorageNameDialog({ mode = "create-folder", initialName = "", isBusy = false, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setName(initialName);
    setValidationError("");
  }, [mode, initialName]);

  const submit = () => {
    if (isBusy) {
      return;
    }

    const message = validateName(name);

    if (message) {
      setValidationError(message);
      return;
    }

    onSubmit?.(name.trim());
  };

  return (
    <section style={{ padding: "1rem", width: "min(420px, 92vw)", fontFamily: "var(--stos-font-ui, inherit)", color: THEME_COLORS.textBody }}>
      <h5 style={{ fontWeight: THEME_TYPE.weightStrong, marginBottom: "1rem", fontSize: THEME_TYPE.fontSize16, color: THEME_COLORS.textStrong, paddingRight: 36 }}>
        {TITLES[mode] || "Name"}
      </h5>

      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder={PLACEHOLDERS[mode] || "Name"}
        value={name}
        error={Boolean(validationError)}
        helperText={validationError || " "}
        onChange={(event) => {
          setName(event.target.value);
          setValidationError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
      />

      <footer style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
        <Button onClick={onCancel} sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize13, color: THEME_COLORS.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isBusy}
          onClick={submit}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: THEME_TYPE.fontSize13,
            boxShadow: "none",
            backgroundColor: THEME_COLORS.brandPrimary,
            "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
          }}
        >
          {mode === "rename" ? "Rename" : "Create"}
        </Button>
      </footer>
    </section>
  );
}

export default StorageNameDialog;

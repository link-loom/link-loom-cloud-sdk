import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddOutlined as AddIcon,
  DeleteOutlineOutlined as RemoveIcon,
} from "@mui/icons-material";
import { CountrySelector } from "@link-loom/react-sdk";

import { formatCountry } from "../../../format/value-formatter";
import { TAX_ID_TYPES_BY_COUNTRY } from "../../../defaults/monetization.defaults";

const MAX_TAX_IDS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_ID_TITLES = {
  ein: "EIN",
  vat: "VAT",
  gst: "GST",
  abn: "ABN",
  nit: "NIT",
  rfc: "RFC",
  cnpj: "CNPJ",
  rut: "RUT",
  cuit: "CUIT",
};

const emptyProfile = {
  legal_name: "",
  email: "",
  phone: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "",
  },
  tax_ids: [],
};

function BillingProfileFormComponent({
  profile,
  copy,
  palette,
  locale,
  isSaving,
  onSave,
  onCancel,
}) {
  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const initial = useMemo(
    () => ({
      ...emptyProfile,
      ...(profile || {}),
      address: { ...emptyProfile.address, ...(profile?.address || {}) },
      tax_ids: profile?.tax_ids || [],
    }),
    [profile],
  );
  const [draft, setDraft] = useState(initial);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [serverFields, setServerFields] = useState({});
  const [message, setMessage] = useState("");

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const localProblems = useMemo(() => {
    const problems = {};

    if (!draft.legal_name.trim()) problems.legal_name = true;
    if (!EMAIL_PATTERN.test(draft.email.trim())) problems.email = true;
    if (!draft.address.line1.trim()) problems["address.line1"] = true;
    if (!draft.address.city.trim()) problems["address.city"] = true;
    if (!draft.address.country) problems["address.country"] = true;

    draft.tax_ids.forEach((taxId, index) => {
      if (!taxId.type) problems[`tax_ids.${index}.type`] = true;
      if (!String(taxId.value || "").trim())
        problems[`tax_ids.${index}.value`] = true;
      if (!taxId.country) problems[`tax_ids.${index}.country`] = true;
      if (taxId.type === "other" && !String(taxId.label || "").trim()) {
        problems[`tax_ids.${index}.label`] = true;
      }
    });

    return problems;
  }, [draft]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const canSave = isDirty && !Object.keys(localProblems).length && !isSaving;

  const fieldError = (key) => Boolean(serverFields[key]);
  const fieldHelp = (key) => serverFields[key] || "";

  const setField = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const setAddress = (field, value) =>
    setDraft((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }));
  const setTaxId = (index, patch) =>
    setDraft((current) => ({
      ...current,
      tax_ids: current.tax_ids.map((taxId, position) =>
        position === index ? { ...taxId, ...patch } : taxId,
      ),
    }));

  const typesFor = (country) =>
    TAX_ID_TYPES_BY_COUNTRY[country] || TAX_ID_TYPES_BY_COUNTRY.DEFAULT;

  const countryValue = (code) =>
    code
      ? {
          country: {
            iso_code: code,
            name: formatCountry(code, { locale: "en" }),
          },
        }
      : null;

  const addTaxId = () =>
    setDraft((current) => ({
      ...current,
      tax_ids: [
        ...current.tax_ids,
        {
          type: typesFor(current.address.country)[0],
          value: "",
          country: current.address.country,
          label: "",
        },
      ],
    }));

  const removeTaxId = (index) =>
    setDraft((current) => ({
      ...current,
      tax_ids: current.tax_ids.filter((_, position) => position !== index),
    }));

  const submit = async () => {
    setMessage("");
    setServerFields({});
    const response = await onSave(draft);

    if (!response?.success) {
      setServerFields(response?.result?.fields || {});
      setMessage(
        response?.result?.fields ? copy.profileNeedsAttention : copy.loadError,
      );
    }
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <section className="d-flex flex-column gap-3">
      {message && (
        <Alert severity="warning" sx={{ borderRadius: "8px" }}>
          {message}
        </Alert>
      )}

      <div className="row g-3">
        <article className="col-12 col-md-6">
          <TextField
            fullWidth
            size="small"
            label={copy.legalNameLabel}
            value={draft.legal_name}
            onChange={(event) => setField("legal_name", event.target.value)}
            error={fieldError("legal_name")}
            helperText={fieldHelp("legal_name")}
            inputProps={{ maxLength: 200 }}
          />
        </article>
        <article className="col-12 col-md-6">
          <TextField
            fullWidth
            size="small"
            type="email"
            label={copy.billingEmailLabel}
            value={draft.email}
            onChange={(event) => setField("email", event.target.value)}
            error={
              fieldError("email") ||
              (draft.email !== "" && Boolean(localProblems.email))
            }
            helperText={fieldHelp("email")}
          />
        </article>
        <article className="col-12 col-md-6">
          <TextField
            fullWidth
            size="small"
            label={copy.addressLine1Label}
            value={draft.address.line1}
            onChange={(event) => setAddress("line1", event.target.value)}
            error={fieldError("address.line1")}
            helperText={fieldHelp("address.line1")}
          />
        </article>
        <article className="col-12 col-md-6">
          <TextField
            fullWidth
            size="small"
            label={copy.addressLine2Label}
            value={draft.address.line2}
            onChange={(event) => setAddress("line2", event.target.value)}
          />
        </article>
        <article className="col-12 col-md-4">
          <TextField
            fullWidth
            size="small"
            label={copy.cityLabel}
            value={draft.address.city}
            onChange={(event) => setAddress("city", event.target.value)}
            error={fieldError("address.city")}
            helperText={fieldHelp("address.city")}
          />
        </article>
        <article className="col-12 col-md-4">
          <TextField
            fullWidth
            size="small"
            label={copy.regionLabel}
            value={draft.address.region}
            onChange={(event) => setAddress("region", event.target.value)}
          />
        </article>
        <article className="col-12 col-md-4">
          <TextField
            fullWidth
            size="small"
            label={copy.postalCodeLabel}
            value={draft.address.postal_code}
            onChange={(event) => setAddress("postal_code", event.target.value)}
            error={fieldError("address.postal_code")}
            helperText={fieldHelp("address.postal_code")}
          />
        </article>
        <article className="col-12 col-md-6">
          <CountrySelector
            label={copy.countryLabel}
            value={countryValue(draft.address.country)}
            onChange={({ country }) => {
              if (
                country?.iso_code &&
                country.iso_code !== draft.address.country
              ) {
                setAddress("country", country.iso_code);
              }
            }}
          />
          {fieldError("address.country") && (
            <Typography variant="caption" sx={{ color: palette.error }}>
              {fieldHelp("address.country")}
            </Typography>
          )}
        </article>
        <article className="col-12 col-md-6">
          <TextField
            fullWidth
            size="small"
            label={copy.phoneLabel}
            value={draft.phone}
            onChange={(event) => setField("phone", event.target.value)}
            inputProps={{ maxLength: 40 }}
          />
        </article>
      </div>

      <section className="d-flex flex-column gap-2">
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: palette.textPrimary }}
        >
          {copy.taxIdsLabel}
        </Typography>

        {draft.tax_ids.map((taxId, index) => (
          <div key={index} className="row g-2 align-items-start">
            <article className="col-12 col-md-3">
              <TextField
                select
                fullWidth
                size="small"
                label={copy.taxIdTypeLabel}
                value={taxId.type}
                onChange={(event) =>
                  setTaxId(index, { type: event.target.value })
                }
                error={fieldError(`tax_ids.${index}.type`)}
              >
                {[
                  ...new Set(
                    [...typesFor(taxId.country), taxId.type].filter(Boolean),
                  ),
                ].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type === "other"
                      ? copy.taxIdOtherNameLabel
                      : TAX_ID_TITLES[type] || type}
                  </MenuItem>
                ))}
              </TextField>
            </article>
            {taxId.type === "other" && (
              <article className="col-12 col-md-3">
                <TextField
                  fullWidth
                  size="small"
                  label={copy.taxIdOtherNameLabel}
                  value={taxId.label || ""}
                  onChange={(event) =>
                    setTaxId(index, { label: event.target.value })
                  }
                  error={fieldError(`tax_ids.${index}.label`)}
                  helperText={fieldHelp(`tax_ids.${index}.label`)}
                />
              </article>
            )}
            <article className="col-12 col-md-3">
              <TextField
                fullWidth
                size="small"
                label={copy.taxIdValueLabel}
                value={taxId.value}
                onChange={(event) =>
                  setTaxId(index, { value: event.target.value })
                }
                error={fieldError(`tax_ids.${index}.value`)}
                helperText={fieldHelp(`tax_ids.${index}.value`)}
              />
            </article>
            <article
              className={
                taxId.type === "other" ? "col-10 col-md-2" : "col-10 col-md-5"
              }
            >
              <CountrySelector
                label={copy.taxIdCountryLabel}
                value={countryValue(taxId.country)}
                onChange={({ country }) => {
                  if (country?.iso_code && country.iso_code !== taxId.country) {
                    setTaxId(index, { country: country.iso_code });
                  }
                }}
              />
            </article>
            <article className="col-2 col-md-1 d-flex justify-content-end">
              <IconButton
                aria-label={copy.removeLabel}
                onClick={() => removeTaxId(index)}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </article>
          </div>
        ))}

        {draft.tax_ids.length < MAX_TAX_IDS && (
          <div>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addTaxId}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: palette.brandPrimary,
              }}
            >
              {copy.addTaxIdLabel}
            </Button>
          </div>
        )}
      </section>

      <footer className="d-flex justify-content-end gap-2">
        <Button
          onClick={onCancel}
          sx={{ textTransform: "none", color: palette.textSecondary }}
        >
          {copy.cancelLabel}
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!canSave}
          onClick={submit}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: palette.brandPrimary,
            "&:hover": { backgroundColor: palette.brandPrimaryDark },
          }}
        >
          {copy.saveLabel}
        </Button>
      </footer>
    </section>
  );
}

export default BillingProfileFormComponent;

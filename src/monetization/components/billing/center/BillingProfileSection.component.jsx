import React, { useState } from "react";
import { Button, Typography } from "@mui/material";
import { EditOutlined as EditIcon } from "@mui/icons-material";

import { formatCountry } from "../../../format/value-formatter";
import BillingMicroLabel from "./shared/BillingMicroLabel.component";
import BillingProfileForm from "./BillingProfileForm.component";
import BillingSectionHeader from "./shared/BillingSectionHeader.component";
import BillingSectionState from "./shared/BillingSectionState.component";

function BillingProfileSectionComponent({
  profileState,
  copy,
  palette,
  locale,
  onAction,
}) {
  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [isEditing, setIsEditing] = useState(false);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const { profile, error, isLoading, isSaving, save, refresh } = profileState;
  const address = profile?.address || {};

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const handleSave = async (draft) => {
    const response = await save(draft);

    if (response?.success) {
      setIsEditing(false);
      onAction?.({ action: "profile-saved", profile: response.result });
    }

    return response;
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const field = (label, value, columns = "col-12 col-md-6") => (
    <article className={columns}>
      <BillingMicroLabel palette={palette}>{label}</BillingMicroLabel>
      <Typography
        variant="body1"
        sx={{ color: palette.textPrimary, mt: 0.5, whiteSpace: "pre-line" }}
      >
        {value || "—"}
      </Typography>
    </article>
  );

  return (
    <>
      <BillingSectionHeader
        title={copy.profileTitle}
        description={copy.profileDescription}
        palette={palette}
        action={
          profile && !isEditing ? (
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setIsEditing(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: palette.textPrimary,
              }}
            >
              {copy.editLabel}
            </Button>
          ) : null
        }
      />

      {isEditing ? (
        <BillingProfileForm
          profile={profile}
          copy={copy}
          palette={palette}
          locale={locale}
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <BillingSectionState
          isLoading={isLoading}
          error={error}
          isEmpty={!profile}
          emptyMessage={copy.profileEmpty}
          emptyAction={
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIsEditing(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: palette.border,
                color: palette.textPrimary,
              }}
            >
              {copy.addDetailsLabel}
            </Button>
          }
          copy={copy}
          palette={palette}
          onRetry={refresh}
        >
          <div className="row g-3">
            {field(copy.legalNameLabel, profile?.legal_name)}
            {field(
              copy.taxIdsLabel,
              (profile?.tax_ids || [])
                .map(
                  (taxId) =>
                    `${(taxId.label || taxId.type || "").toUpperCase()} ${taxId.value} (${taxId.country})`,
                )
                .join("\n"),
            )}
            {field(
              copy.addressLine1Label,
              [address.line1, address.line2].filter(Boolean).join("\n"),
            )}
            {field(
              copy.cityLabel,
              [address.city, address.region].filter(Boolean).join(", "),
            )}
            {field(
              copy.countryLabel,
              formatCountry(address.country, { locale }),
            )}
            {field(copy.postalCodeLabel, address.postal_code)}
            {field(copy.billingEmailLabel, profile?.email)}
            {field(copy.phoneLabel, profile?.phone)}
          </div>
        </BillingSectionState>
      )}
    </>
  );
}

export default BillingProfileSectionComponent;

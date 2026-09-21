import React from "react";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME } from "../../defaults/launchpad.theme";

const PremiumContainer = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
`;

const RequestButton = styled.button`
  background-color: ${THEME.brand};
  color: #ffffff;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease;

  &:hover {
    background-color: ${THEME.brandHover};
  }
`;

function AppStorePremiumCardComponent({ app, onRequestPremium }) {
  const { storeLabels } = useLaunchpadConfig();
  const labels = storeLabels.premium;
  const premiumState = app?.marketplace_details?.premium_state;

  if (!premiumState || premiumState === "entitled") return null;

  const isNotEntitled = premiumState === "not_entitled";
  const title = isNotEntitled ? labels.enablementTitle : labels.installationTitle;
  const installedLabel = isNotEntitled ? labels.yes : labels.no;
  const installedColor = isNotEntitled ? THEME.success : THEME.danger;
  const buttonLabel = isNotEntitled ? labels.requestEnablement : labels.requestInstallation;
  const requestType = isNotEntitled ? "enablement" : "installation";

  return (
    <PremiumContainer className="d-flex flex-column gap-2 p-3 mb-3">
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{title}</span>

      <div className="d-flex flex-column gap-1">
        <div className="d-flex align-items-center gap-2">
          <StatusDot style={{ backgroundColor: installedColor }} />
          <span style={{ fontSize: "12px", color: "#6B7280" }}>
            {labels.installedIn} <strong>{installedLabel}</strong>
          </span>
        </div>
        {isNotEntitled && (
          <div className="d-flex align-items-center gap-2">
            <StatusDot style={{ backgroundColor: THEME.danger }} />
            <span style={{ fontSize: "12px", color: "#6B7280" }}>
              {labels.enabledFor} <strong>{labels.no}</strong>
            </span>
          </div>
        )}
      </div>

      <RequestButton className="btn btn-sm mt-1" onClick={() => onRequestPremium?.(app.slug, requestType)}>
        {buttonLabel}
      </RequestButton>
    </PremiumContainer>
  );
}

export default AppStorePremiumCardComponent;

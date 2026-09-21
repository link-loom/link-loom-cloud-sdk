import React from "react";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME } from "../../defaults/launchpad.theme";

const PillWrapper = styled.span`
  background-color: #f3f4f6;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 120ms ease;
  white-space: nowrap;

  &:hover {
    background-color: #e5e7eb;
  }
`;

function AppStorePublisherPillComponent({ publisher, onClick }) {
  const { storeLabels } = useLaunchpadConfig();
  const name = publisher?.name || publisher?.profile?.name || storeLabels.card.unknownPublisher;
  const verified = publisher?.verified ?? publisher?.profile?.verified ?? false;
  const url = publisher?.url || publisher?.profile?.url || null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) return onClick();
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <PillWrapper
      className="d-inline-flex align-items-center gap-1"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
    >
      {name}
      {verified && <CheckCircleIcon sx={{ fontSize: 13, color: THEME.success }} />}
    </PillWrapper>
  );
}

export default AppStorePublisherPillComponent;

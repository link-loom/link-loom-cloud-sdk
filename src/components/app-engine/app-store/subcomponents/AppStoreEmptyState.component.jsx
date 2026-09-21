import React from "react";
import { SearchOff as SearchOffIcon, RocketLaunch as RocketLaunchIcon } from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME } from "../../defaults/launchpad.theme";

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 6px 0;
`;

const EmptySubtitle = styled.p`
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 20px 0;
  max-width: 280px;
`;

const ActionButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 120ms ease;
  border: none;

  &.primary {
    background-color: ${THEME.brand};
    color: #ffffff;

    &:hover {
      background-color: ${THEME.brandHover};
    }
  }

  &.secondary {
    background-color: #f3f4f6;
    color: #374151;

    &:hover {
      background-color: #e5e7eb;
    }
  }
`;

function AppStoreEmptyStateComponent({ searchTerm, selectedCategory, onClearFilters, onCreateApp }) {
  const { storeLabels } = useLaunchpadConfig();
  const labels = storeLabels.empty;

  if (searchTerm) {
    return (
      <EmptyContainer>
        <EmptyIcon>
          <SearchOffIcon sx={{ fontSize: 28, color: "#9CA3AF" }} />
        </EmptyIcon>
        <EmptyTitle>{labels.noResultsTitle}</EmptyTitle>
        <EmptySubtitle>{labels.noResultsHint}</EmptySubtitle>
        <ActionButton className="secondary" onClick={onClearFilters}>
          {labels.clearSearch}
        </ActionButton>
      </EmptyContainer>
    );
  }

  if (selectedCategory) {
    return (
      <EmptyContainer>
        <EmptyIcon>
          <SearchOffIcon sx={{ fontSize: 28, color: "#9CA3AF" }} />
        </EmptyIcon>
        <EmptyTitle>{labels.emptyCategoryTitle}</EmptyTitle>
        <EmptySubtitle>{labels.emptyCategoryHint}</EmptySubtitle>
        <ActionButton className="secondary" onClick={onClearFilters}>
          {labels.viewAll}
        </ActionButton>
      </EmptyContainer>
    );
  }

  return (
    <EmptyContainer>
      <EmptyIcon>
        <RocketLaunchIcon sx={{ fontSize: 28, color: THEME.purple }} />
      </EmptyIcon>
      <EmptyTitle>{labels.firstAppTitle}</EmptyTitle>
      <EmptySubtitle>{labels.firstAppHint}</EmptySubtitle>
      {onCreateApp && (
        <ActionButton className="primary" onClick={onCreateApp}>
          {labels.createApp}
        </ActionButton>
      )}
    </EmptyContainer>
  );
}

export default AppStoreEmptyStateComponent;

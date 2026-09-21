import React from "react";
import { IconButton } from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon, Add as AddIcon } from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME } from "../../defaults/launchpad.theme";

const HeaderContainer = styled.div`
  height: 72px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const SearchWrapper = styled.div`
  width: 320px;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 0 12px;
  height: 38px;
  transition: border-color 150ms ease;

  &:focus-within {
    border-color: ${THEME.brand};
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  background-color: transparent;
  font-size: 14px;
  color: #374151;
  flex: 1;
  height: 100%;
  margin-left: 8px;

  &::placeholder {
    color: #9ca3af;
  }
`;

const KeyHint = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`;

const CreateButton = styled.button`
  background-color: ${THEME.brand};
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 120ms ease;
  white-space: nowrap;

  &:hover {
    background-color: ${THEME.brandHover};
  }
`;

function AppStoreHeaderBarComponent({ searchTerm, onSearchChange, searchInputRef, onCreateApp }) {
  const { storeLabels: labels } = useLaunchpadConfig();

  return (
    <HeaderContainer className="d-flex align-items-center justify-content-between px-4">
      <div className="d-flex align-items-center">
        <h5 className="mb-0">{labels.catalogTitle}</h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        <SearchWrapper className="d-flex align-items-center">
          <SearchIcon sx={{ color: "#9CA3AF", fontSize: 18, flexShrink: 0 }} />
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm ? (
            <IconButton size="small" onClick={() => onSearchChange("")} sx={{ padding: "2px" }}>
              <ClearIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
            </IconButton>
          ) : (
            <KeyHint>{labels.searchShortcut}</KeyHint>
          )}
        </SearchWrapper>

        {onCreateApp && (
          <CreateButton className="d-flex align-items-center gap-1" onClick={onCreateApp}>
            <AddIcon sx={{ fontSize: 18 }} />
            {labels.newApp}
          </CreateButton>
        )}
      </div>
    </HeaderContainer>
  );
}

export default AppStoreHeaderBarComponent;

import React from 'react';
import styled from 'styled-components';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import { SUPPORT_THEME } from '../defaults/support.theme';
import {
  SUPPORT_CATEGORY_GRID_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const CategoryCard = styled.article.attrs({ className: 'card border h-100' })`
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  padding: 1.5rem 1.25rem 1.25rem;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(40, 52, 57, 0.08);
  }
`;

const StartCasePill = styled.button`
  background: ${SUPPORT_THEME.surfaceContainerLow};
  border: none;
  border-radius: 2rem;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${SUPPORT_THEME.onSurfaceVariant};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: ${SUPPORT_THEME.surfaceContainer};
    color: ${SUPPORT_THEME.onSurface};
  }
`;

const ICON_MAP = {
  BugReport: BugReportOutlinedIcon,
  Settings: SettingsOutlinedIcon,
  Security: SecurityOutlinedIcon,
  Storage: StorageOutlinedIcon,
  IntegrationInstructions: IntegrationInstructionsOutlinedIcon,
  HelpOutline: HelpOutlineIcon,
  Speed: SpeedOutlinedIcon,
  AccountBalance: AccountBalanceOutlinedIcon,
  CreditCard: CreditCardOutlinedIcon,
  Devices: DevicesOutlinedIcon,
  VpnKey: VpnKeyOutlinedIcon,
  AutoFixHigh: AutoFixHighOutlinedIcon,
};

const getIconComponent = (iconName) => {
  if (!iconName) return HelpOutlineIcon;
  if (typeof iconName === 'function') return iconName;
  return ICON_MAP[iconName] || HelpOutlineIcon;
};

const SupportCategoryGrid = ({ categories, ui, itemOnAction, ...props }) => {
  const config = mergeDefaults(SUPPORT_CATEGORY_GRID_DEFAULTS, ui);

  if (!categories || categories.length === 0) return null;

  const handleCategorySelect = (category, event) => {
    event?.stopPropagation();
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::category-select',
      namespace: 'link-loom-support',
      payload: { category },
    });
  };

  return (
    <div className="row g-3" {...props}>
      {categories.map((category, index) => {
        const Icon = getIconComponent(category.icon);

        return (
          <div className={config.gridColumnClass} key={category.id || index}>
            <CategoryCard onClick={(e) => handleCategorySelect(category, e)}>
              <div className="d-flex flex-column h-100">
                {/* Plain icon — no background container */}
                <div style={{ marginBottom: '0.875rem' }}>
                  <Icon sx={{ fontSize: 28, color: SUPPORT_THEME.outline }} />
                </div>
                <strong
                  className="d-block mb-2"
                  style={{ fontSize: '0.95rem', color: SUPPORT_THEME.onSurface, lineHeight: 1.3 }}
                >
                  {category.title || category.name}
                </strong>
                <p
                  className="flex-grow-1 mb-3"
                  style={{
                    fontSize: '0.8rem',
                    color: SUPPORT_THEME.textMuted,
                    lineHeight: 1.55,
                    margin: 0,
                    marginBottom: '1rem',
                  }}
                >
                  {category.description}
                </p>
                <div>
                  <StartCasePill onClick={(e) => handleCategorySelect(category, e)}>
                    {config.startCaseLabel}
                  </StartCasePill>
                </div>
              </div>
            </CategoryCard>
          </div>
        );
      })}
    </div>
  );
};

export default SupportCategoryGrid;

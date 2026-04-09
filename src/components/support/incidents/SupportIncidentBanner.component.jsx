import React from 'react';
import styled from 'styled-components';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { SUPPORT_THEME } from '../defaults/support.theme';
import {
  SUPPORT_INCIDENT_BANNER_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const BannerCard = styled.div.attrs({ className: 'card border' })`
  padding: 1rem 1.25rem;
  background: ${SUPPORT_THEME.surfaceContainerLow};
  border-color: ${SUPPORT_THEME.surfaceContainer} !important;
  cursor: pointer;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  &:hover {
    background-color: ${SUPPORT_THEME.surfaceContainer};
  }
`;

const Row = styled.div.attrs({ className: 'd-flex align-items-center justify-content-between' })`
  gap: 1rem;
`;

const IconCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${SUPPORT_THEME.surfaceContainerLowest};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(40, 52, 57, 0.08);
`;

const ViewDetailsBtn = styled.span`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${SUPPORT_THEME.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover {
    color: ${SUPPORT_THEME.onSurface};
  }
`;

const SupportIncidentBanner = ({ recentCases, namespace, ui, itemOnAction, ...props }) => {
  const config = mergeDefaults(SUPPORT_INCIDENT_BANNER_DEFAULTS, ui);
  const productName = namespace?.presentation?.hero_title || namespace?.title || 'your product';

  const terminalStatuses = new Set(['resolved', 'closed', 'cancelled', 'deleted']);
  const hasOpenCases = (recentCases || []).some((c) => {
    const statusName = (c.status?.name || c.status || '').toLowerCase();
    return !terminalStatuses.has(statusName);
  });

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  const subtitle = hasOpenCases
    ? `Our team is here to help with ${productName}`
    : `No open cases for ${productName}`;

  return (
    <BannerCard onClick={() => emit('view-all-cases')} {...props}>
      <Row>
        <div className="d-flex align-items-center gap-3">
          <IconCircle>
            <CheckIcon sx={{ fontSize: 18, color: SUPPORT_THEME.onSurfaceVariant }} />
          </IconCircle>
          <div>
            <span className="fw-semibold d-block" style={{ fontSize: '0.875rem', color: SUPPORT_THEME.onSurface }}>
              All systems operational
            </span>
            <span style={{ fontSize: '0.78rem', color: SUPPORT_THEME.textMuted }}>
              {subtitle}
            </span>
          </div>
        </div>
        <ViewDetailsBtn>
          {config.viewDetailsLabel}
          <ArrowForwardIcon sx={{ fontSize: 14 }} />
        </ViewDetailsBtn>
      </Row>
    </BannerCard>
  );
};

export default SupportIncidentBanner;

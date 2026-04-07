import React from 'react';
import styled from 'styled-components';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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

const IncidentBannerCard = styled.div.attrs({ className: 'card border' })`
  padding: 1rem 1.25rem;
  border-left-width: 3px !important;
  border-left-color: ${(props) => props.$accentColor} !important;
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

const ViewDetailsBtn = styled.button`
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

const SupportIncidentBanner = ({ incidents, namespace, ui, itemOnAction, ...props }) => {
  const config = mergeDefaults(SUPPORT_INCIDENT_BANNER_DEFAULTS, ui);
  const hasIncidents = incidents && incidents.length > 0;
  const productName = namespace?.presentation?.hero_title || namespace?.title || 'your product';

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  if (!hasIncidents) {
    return (
      <BannerCard onClick={() => emit('view-status-page')} {...props}>
        <Row>
          <div className="d-flex align-items-center gap-3">
            <IconCircle>
              <CheckIcon sx={{ fontSize: 18, color: SUPPORT_THEME.onSurfaceVariant }} />
            </IconCircle>
            <div>
              <span className="fw-semibold d-block" style={{ fontSize: '0.875rem', color: SUPPORT_THEME.onSurface }}>
                No active incidents for {productName}
              </span>
              <span style={{ fontSize: '0.78rem', color: SUPPORT_THEME.textMuted }}>
                {config.noIncidentsSubtitle}
              </span>
            </div>
          </div>
          <ViewDetailsBtn as="span">
            {config.viewDetailsLabel}
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </ViewDetailsBtn>
        </Row>
      </BannerCard>
    );
  }

  return (
    <div className="d-flex flex-column gap-2" {...props}>
      {incidents.map((incident, index) => {
        const isCritical = incident.severity === 'critical' || incident.severity === 'high';
        const accentColor = isCritical ? SUPPORT_THEME.error : SUPPORT_THEME.warning;
        const Icon = isCritical ? ErrorOutlineIcon : WarningAmberOutlinedIcon;

        return (
          <IncidentBannerCard key={incident.id || index} $accentColor={accentColor}>
            <Row>
              <div className="d-flex align-items-center gap-3">
                <IconCircle>
                  <Icon sx={{ fontSize: 18, color: accentColor }} />
                </IconCircle>
                <div>
                  <span className="fw-semibold d-block" style={{ fontSize: '0.875rem', color: SUPPORT_THEME.onSurface }}>
                    {incident.title}
                  </span>
                  {incident.summary && (
                    <span style={{ fontSize: '0.78rem', color: SUPPORT_THEME.textMuted }}>
                      {incident.summary}
                    </span>
                  )}
                </div>
              </div>
              <ViewDetailsBtn onClick={() => emit('incident-view', { incident })}>
                {config.viewDetailsLabel}
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </ViewDetailsBtn>
            </Row>
          </IncidentBannerCard>
        );
      })}
    </div>
  );
};

export default SupportIncidentBanner;

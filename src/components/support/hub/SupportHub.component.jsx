import React from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SupportIncidentBanner from '../incidents/SupportIncidentBanner.component';
import SupportCategoryGrid from '../categories/SupportCategoryGrid.component';
import { SUPPORT_THEME } from '../defaults/support.theme';
import {
  SUPPORT_HUB_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

/* ── Styled ──────────────────────────────────────────────────────── */

const HubCard = styled.div.attrs({ className: 'card border' })`
  padding: 2rem;
`;

const ActionCard = styled.article.attrs({ className: 'card border h-100' })`
  padding: 1.25rem 1rem;
  cursor: pointer;
  transition: transform 0.15s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  &:hover {
    transform: translateY(-1px);
  }
`;

const ActionCardInverted = styled.article.attrs({ className: 'card h-100' })`
  padding: 1.25rem 1rem;
  cursor: pointer;
  background: linear-gradient(135deg, ${SUPPORT_THEME.primary} 0%, ${SUPPORT_THEME.primaryDim} 100%);
  color: ${SUPPORT_THEME.onPrimary};
  border: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-1px);
  }
`;

const IconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${SUPPORT_THEME.radiusMd};
  background: ${(props) => props.$bg || SUPPORT_THEME.surfaceContainerLow};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 0.75rem;
`;

const SidebarCard = styled.div.attrs({ className: 'card border' })`
  padding: 1.5rem;
`;

const AssistantCard = styled(SidebarCard)`
  margin-bottom: 1.25rem;
  @media (min-width: 992px) {
    margin-top: 2.65rem;
  }
`;

const RecentCaseItem = styled.div`
  padding: 0.75rem 0;
  cursor: pointer;
  border-bottom: 1px solid ${SUPPORT_THEME.surfaceContainerLow};
  &:last-of-type {
    border-bottom: none;
  }
  &:hover {
    background: ${SUPPORT_THEME.surfaceContainerLow};
    margin: 0 -1rem;
    padding: 0.75rem 1rem;
    border-radius: ${SUPPORT_THEME.radiusMd};
  }
`;

const SectionLabel = styled.h6.attrs({ className: 'text-uppercase fw-semibold' })`
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: ${SUPPORT_THEME.textMuted};
  margin-bottom: 1rem;
`;

const BrowseAllBtn = styled.button`
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${SUPPORT_THEME.textSecondary};
  cursor: pointer;
  padding: 0;
  &:hover {
    color: ${SUPPORT_THEME.onSurface};
  }
`;

/* ── Quick Action Config ─────────────────────────────────────────── */

const ACTIONS = [
  { key: 'report-issue', Icon: ReportProblemOutlinedIcon, label: 'Report an issue', description: 'Submit a new support case', color: SUPPORT_THEME.error, bg: `${SUPPORT_THEME.error}15` },
  { key: 'request-help', Icon: HelpOutlineIcon, label: 'Request help', description: 'Get assistance from the team', color: SUPPORT_THEME.tertiary, bg: `${SUPPORT_THEME.tertiary}15` },
  { key: 'view-incidents', Icon: VisibilityOutlinedIcon, label: 'View incidents', description: 'Check active service incidents', color: SUPPORT_THEME.onSurfaceVariant, bg: SUPPORT_THEME.surfaceContainerLow },
  { key: 'ask-assistant', Icon: AutoAwesomeOutlinedIcon, label: 'Ask support assistant', description: 'AI-guided troubleshooting', inverted: true },
];

/* ── Component ───────────────────────────────────────────────────── */

const SupportHub = ({
  ui,
  namespace,
  categories,
  incidents,
  recentCases,
  guides,
  context,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_HUB_DEFAULTS, ui);

  const heroTitle = namespace?.presentation?.hero_title || namespace?.title || config.title;
  const heroSubtitle = namespace?.presentation?.hero_subtitle || namespace?.subtitle || config.subtitle;

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  return (
    <HubCard {...props}>
      {/* Hero */}
      <header className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: SUPPORT_THEME.onSurface }}>
          {heroTitle}
        </h2>
        <p className="text-muted mb-0" style={{ maxWidth: 640 }}>
          {heroSubtitle}
        </p>
      </header>

      {/* Incident Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <SupportIncidentBanner incidents={incidents} namespace={namespace} itemOnAction={itemOnAction} />
      </div>

      {/* Immediate Actions — full width */}
      <section style={{ marginBottom: '2rem' }}>
        <SectionLabel>Immediate Actions</SectionLabel>
        <div className="row g-3">
          {ACTIONS.map((action) => {
            const Card = action.inverted ? ActionCardInverted : ActionCard;
            return (
              <div className="col-6 col-md-3" key={action.key}>
                <Card onClick={() => emit(action.key)}>
                  <IconCircle $bg={action.inverted ? 'rgba(255,255,255,0.18)' : action.bg}>
                    <action.Icon sx={{ fontSize: 20, color: action.inverted ? SUPPORT_THEME.onPrimary : action.color }} />
                  </IconCircle>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>{action.label}</strong>
                  <span style={{ fontSize: '0.75rem', color: action.inverted ? 'rgba(255,255,255,0.7)' : SUPPORT_THEME.textMuted, marginTop: '0.2rem' }}>
                    {action.description}
                  </span>
                </Card>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-column layout: main content + sidebar */}
      <div className="row" style={{ gap: 0 }}>
        {/* ── Main Column ───────────────────────────────────── */}
        <div className="col-12 col-lg-8 pe-lg-4">

          {/* Common Categories */}
          {categories && categories.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <SectionLabel className="mb-0">Common Categories</SectionLabel>
                <BrowseAllBtn onClick={() => emit('browse-all-categories')}>Browse All</BrowseAllBtn>
              </div>
              <SupportCategoryGrid categories={categories} itemOnAction={itemOnAction} />
            </section>
          )}

          {/* Documentation Shortcuts */}
          {guides && guides.length > 0 && (
            <section>
              <SectionLabel>Documentation Shortcuts</SectionLabel>
              <div className="card border" style={{ overflow: 'hidden' }}>
                {guides.map((guide, index) => (
                  <div
                    key={guide.id}
                    className="d-flex flex-row align-items-center justify-content-between"
                    style={{
                      padding: '0.625rem 1rem',
                      cursor: 'pointer',
                      borderBottom: index < guides.length - 1 ? `1px solid ${SUPPORT_THEME.surfaceContainerLow}` : 'none',
                    }}
                    onClick={() => emit('guide-click', { guide })}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 30, height: 30, borderRadius: SUPPORT_THEME.radiusMd, background: SUPPORT_THEME.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MenuBookOutlinedIcon sx={{ fontSize: 15, color: SUPPORT_THEME.outline }} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: SUPPORT_THEME.onSurface, display: 'block' }}>{guide.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: SUPPORT_THEME.textMuted }}>{guide.summary}</span>
                      </div>
                    </div>
                    <ArrowForwardIcon sx={{ fontSize: 15, color: SUPPORT_THEME.outlineVariant, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar Column ─────────────────────────────────── */}
        <div className="col-12 col-lg-4 mt-4 mt-lg-0">

          {/* Assistant Card */}
          <AssistantCard>
            <h6 style={{ fontWeight: 700, fontSize: '1rem', color: SUPPORT_THEME.onSurface, marginBottom: '0.5rem' }}>
              Ask the Support Assistant
            </h6>
            <p style={{ fontSize: '0.8rem', color: SUPPORT_THEME.textSecondary, lineHeight: 1.6, marginBottom: '1rem' }}>
              Get guided help based on your current context. Our AI can analyze your setup logs and suggest immediate fixes.
            </p>
            <Button
              fullWidth
              variant="contained"
              onClick={() => emit('ask-assistant')}
              startIcon={<ChatOutlinedIcon sx={{ fontSize: 16 }} />}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              sx={{
                background: `linear-gradient(135deg, ${SUPPORT_THEME.primary} 0%, ${SUPPORT_THEME.primaryDim} 100%)`,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderRadius: SUPPORT_THEME.radiusMd,
                boxShadow: 'none',
                py: 1.2,
                '&:hover': { background: `linear-gradient(135deg, ${SUPPORT_THEME.primaryDim} 0%, ${SUPPORT_THEME.primary} 100%)`, boxShadow: 'none' },
              }}
            >
              Start Conversation
            </Button>
          </AssistantCard>

          {/* Recent Activity */}
          <SidebarCard>
            <SectionLabel>Recent Activity</SectionLabel>
            {(!recentCases || recentCases.length === 0) ? (
              <div className="d-flex align-items-center gap-2" style={{ padding: '0.25rem 0' }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: SUPPORT_THEME.success }} />
                <span style={{ fontSize: '0.8rem', color: SUPPORT_THEME.textMuted }}>No recent activity</span>
              </div>
            ) : (
              <div className="d-flex flex-column">
                {recentCases.slice(0, 3).map((c, i) => (
                  <RecentCaseItem key={c.id || i} onClick={() => emit('case-view', { caseId: c.id, supportCase: c })}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span style={{ fontSize: '0.7rem', color: SUPPORT_THEME.textMuted }}>{c.case_id || c.id}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: c.severity === 'critical' ? SUPPORT_THEME.error : SUPPORT_THEME.textMuted, textTransform: 'uppercase' }}>
                        {c.severity || c.priority || ''}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.8rem', color: SUPPORT_THEME.onSurface, display: 'block', marginBottom: '0.25rem' }}>{c.title}</strong>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.status?.name === 'resolved' ? SUPPORT_THEME.success : SUPPORT_THEME.warning, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.7rem', color: SUPPORT_THEME.textSecondary }}>{c.status?.title || 'Open'}</span>
                      <span style={{ fontSize: '0.7rem', color: SUPPORT_THEME.textMuted, marginLeft: 'auto' }}>
                        {c.created_at ? new Date(parseInt(c.created_at)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                  </RecentCaseItem>
                ))}
                <button
                  onClick={() => emit('view-all-cases')}
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: SUPPORT_THEME.textSecondary, cursor: 'pointer', padding: '0.75rem 0 0', textAlign: 'center' }}
                >
                  View Case History
                </button>
              </div>
            )}
          </SidebarCard>
        </div>
      </div>
    </HubCard>
  );
};

export default SupportHub;

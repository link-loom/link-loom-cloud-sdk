import React, { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ComputerIcon from '@mui/icons-material/Computer';
import RouteIcon from '@mui/icons-material/AltRoute';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SupportStatusBadge from '../shared/SupportStatusBadge.component';
import SupportSeverityBadge from '../shared/SupportSeverityBadge.component';
import SupportTimelineBlock from '../timeline/SupportTimelineBlock.component';
import SupportResponseComposer from '../timeline/SupportResponseComposer.component';
import SupportEmptyState from '../shared/SupportEmptyState.component';
import {
  SUPPORT_CASE_DETAIL_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const formatDate = (createdField) => {
  if (!createdField) return '-';
  try {
    const raw = createdField?.timestamp ?? createdField;
    const ms = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    const date = new Date(ms);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const SidebarSection = ({ title, children, theme }) => (
  <div className="card border p-3 mb-3">
    <p
      className="text-uppercase fw-semibold mb-3 mb-0"
      style={{ fontSize: '10px', letterSpacing: '0.07em', color: theme.textMuted }}
    >
      {title}
    </p>
    <div className="d-flex flex-column">{children}</div>
  </div>
);

const InfoRow = ({ label, value, theme, children }) => {
  if (!value && !children) return null;
  return (
    <div
      className="d-flex justify-content-between align-items-center py-2"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      <span style={{ fontSize: '12px', color: theme.textSecondary }}>{label}</span>
      {children || (
        <span className="fw-medium" style={{ fontSize: '12px', color: theme.textPrimary }}>
          {value}
        </span>
      )}
    </div>
  );
};

const TruncatedIdRow = ({ label, value, theme }) => {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="d-flex justify-content-between align-items-center py-2"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      <span style={{ fontSize: '12px', color: theme.textSecondary, flexShrink: 0 }}>{label}</span>
      <div className="d-flex align-items-center gap-1" style={{ minWidth: 0 }}>
        <Tooltip title={value} placement="top">
          <span
            className="fw-medium text-truncate"
            style={{ fontSize: '12px', color: theme.textPrimary, maxWidth: '100px' }}
          >
            {value}
          </span>
        </Tooltip>
        <Tooltip title={copied ? 'Copied!' : 'Copy'} placement="top">
          <IconButton size="small" onClick={handleCopy} sx={{ padding: '2px' }}>
            {copied
              ? <CheckIcon sx={{ fontSize: 12, color: theme.success }} />
              : <ContentCopyIcon sx={{ fontSize: 12, color: theme.textMuted }} />
            }
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

const SupportCaseDetail = ({
  ui,
  supportCase,
  messages,
  context,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_CASE_DETAIL_DEFAULTS, ui);
  const theme = config.theme;

  if (!supportCase) {
    return <SupportEmptyState message="Case not found" />;
  }

  const caseId = supportCase.case_id || supportCase.id;
  const timeline = messages || supportCase.messages || [];
  const diagnostics = supportCase.diagnostics_snapshot || {};
  const resources = supportCase.resources || [];
  const caseStatusName = supportCase.status?.name || supportCase.status;
  const isClosed = caseStatusName === 'resolved' || caseStatusName === 'closed';

  const handleBreadcrumbClick = () => {
    if (!itemOnAction) return;
    itemOnAction({ action: 'link-loom-support::view-all-cases', payload: {} });
  };

  const handleResolve = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-resolve',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handlePostResponse = (responseData) => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-reply',
      payload: { caseId: supportCase.id, supportCase, ...responseData },
    });
  };

  const handleResourceClick = (resource) => {
    if (!itemOnAction) return;
    itemOnAction({ action: 'link-loom-support::resource-view', payload: { resource } });
  };

  return (
    <div {...props}>
      {/* Breadcrumb — outside card */}
      <Breadcrumbs className="mb-3" sx={{ fontSize: '13px' }} separator=">">
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={handleBreadcrumbClick}
          sx={{ fontSize: '13px', color: theme.textSecondary }}
        >
          {config.breadcrumbRoot}
        </Link>
        <span style={{ fontSize: '13px', color: theme.textPrimary, fontWeight: 500 }}>
          #{caseId}
        </span>
      </Breadcrumbs>

      {/* Main card */}
      <div className="card border p-4">
        {/* Header */}
        <header className="d-flex flex-row justify-content-between align-items-start mb-4 pb-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <h5 className="fw-bold mb-2" style={{ color: theme.textPrimary }}>
              {supportCase.title}
            </h5>
            <div className="d-flex align-items-center gap-2">
              <SupportStatusBadge status={supportCase.status} />
              <span style={{ fontSize: '12px', color: theme.textMuted }}>
                Created {formatDate(supportCase.created)}
              </span>
            </div>
          </div>
          {!isClosed && (
            <div className="d-flex gap-2">
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                onClick={handleResolve}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderColor: theme.success,
                  color: theme.success,
                  '&:hover': { borderColor: theme.success, backgroundColor: '#f0fdf4' },
                }}
              >
                {config.resolveLabel}
              </Button>
            </div>
          )}
        </header>

        <div className="row g-4">
          {/* Left column — timeline + composer */}
          <div className="col-md-8">
            {supportCase.summary && (
              <p className="mb-3" style={{ fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                {supportCase.summary}
              </p>
            )}

            {supportCase.details && (
              <div className="mb-4">
                <p
                  className="text-uppercase fw-semibold mb-2"
                  style={{ fontSize: '10px', letterSpacing: '0.07em', color: theme.textMuted }}
                >
                  Details
                </p>
                <p style={{ fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                  {supportCase.details}
                </p>
              </div>
            )}

            <section className="mb-4">
              {timeline.length === 0 ? (
                <SupportEmptyState message="No messages yet" />
              ) : (
                <div>
                  {timeline.map((message, index) => (
                    <SupportTimelineBlock key={message.id || index} message={message} />
                  ))}
                </div>
              )}
            </section>

            {!isClosed && <SupportResponseComposer onSubmit={handlePostResponse} />}
          </div>

          {/* Right column — sidebar */}
          <div className="col-md-4">
            <SidebarSection title={config.caseInfoTitle} theme={theme}>
              {supportCase.severity && (
                <InfoRow label={config.labelSeverity} theme={theme}>
                  <SupportSeverityBadge severity={supportCase.severity} />
                </InfoRow>
              )}
              {supportCase.priority && (
                <InfoRow label={config.labelPriority} theme={theme}>
                  <SupportSeverityBadge severity={supportCase.priority} />
                </InfoRow>
              )}
              <InfoRow label="Source" value={supportCase.source_type} theme={theme} />
              <TruncatedIdRow label="Category" value={supportCase.issue_category_id} theme={theme} />
              <InfoRow
                label="Assigned to"
                value={supportCase.assigned_user_id || 'Unassigned'}
                theme={theme}
              />
            </SidebarSection>

            {supportCase.business_impact && (
              <SidebarSection title="Business Impact" theme={theme}>
                <p className="mb-0 mt-1" style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.6 }}>
                  {supportCase.business_impact}
                </p>
              </SidebarSection>
            )}

            {(diagnostics.environment || diagnostics.current_route || context?.environment) && (
              <SidebarSection title={config.diagnosticsTitle} theme={theme}>
                {(diagnostics.environment || context?.environment) && (
                  <div
                    className="d-flex align-items-center gap-2 py-2"
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                  >
                    <ComputerIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                      {config.labelEnvironment}
                    </span>
                    <span className="ms-auto fw-medium" style={{ fontSize: '12px', color: theme.textPrimary }}>
                      {diagnostics.environment || context?.environment}
                    </span>
                  </div>
                )}
                {diagnostics.current_route && (
                  <div className="d-flex align-items-center gap-2 py-2">
                    <RouteIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ fontSize: '12px', color: theme.textSecondary }}>Route</span>
                    <span
                      className="ms-auto fw-medium text-truncate"
                      style={{ fontSize: '12px', color: theme.textPrimary, maxWidth: '160px' }}
                    >
                      {diagnostics.current_route}
                    </span>
                  </div>
                )}
              </SidebarSection>
            )}

            {resources.length > 0 && (
              <SidebarSection title={config.internalResourcesTitle} theme={theme}>
                <div className="d-flex flex-column gap-2 pt-1">
                  {resources.map((resource, index) => (
                    <div
                      key={resource.id || index}
                      className="d-flex align-items-center gap-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleResourceClick(resource)}
                    >
                      <MenuBookIcon sx={{ fontSize: 14, color: theme.brandAccent }} />
                      <span style={{ fontSize: '12px', color: theme.brandAccent }}>
                        {resource.title || resource.name}
                      </span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCaseDetail;

import React from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ComputerIcon from '@mui/icons-material/Computer';
import LanguageIcon from '@mui/icons-material/Language';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SupportStatusBadge from '../shared/SupportStatusBadge.component';
import SupportSeverityBadge from '../shared/SupportSeverityBadge.component';
import SupportTimelineBlock from '../timeline/SupportTimelineBlock.component';
import SupportResponseComposer from '../timeline/SupportResponseComposer.component';
import SupportEmptyState from '../shared/SupportEmptyState.component';
import {
  SUPPORT_CASE_DETAIL_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};

const InfoRow = ({ label, value, theme }) => {
  if (!value) return null;
  return (
    <div className="d-flex justify-content-between align-items-center py-1">
      <span style={{ fontSize: '12px', color: theme.textSecondary }}>{label}</span>
      <span className="fw-medium" style={{ fontSize: '12px', color: theme.textPrimary }}>
        {value}
      </span>
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

  const handleBreadcrumbClick = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::cases-list',
      namespace: 'link-loom-support',
      payload: {},
    });
  };

  const handleEscalate = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-escalate',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handleResolve = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-resolve',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handlePostResponse = (responseData) => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-reply',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase, ...responseData },
    });
  };

  const handleResourceClick = (resource) => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::resource-view',
      namespace: 'link-loom-support',
      payload: { resource },
    });
  };

  const diagnostics = context || supportCase.diagnostics || {};
  const resources = supportCase.resources || [];

  return (
    <div {...props}>
      {/* Breadcrumb */}
      <Breadcrumbs
        className="mb-3"
        sx={{ fontSize: '13px' }}
        separator=">"
      >
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

      {/* Header */}
      <header className="d-flex flex-row justify-content-between align-items-start mb-4">
        <div>
          <h3 className="fw-bold mb-2" style={{ color: theme.textPrimary }}>
            {supportCase.title}
          </h3>
          <div className="d-flex align-items-center gap-2">
            <SupportStatusBadge status={supportCase.status} />
            <span style={{ fontSize: '12px', color: theme.textMuted }}>
              Created {formatDate(supportCase.created_at)}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
            onClick={handleEscalate}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              borderColor: theme.warning,
              color: theme.warning,
              '&:hover': { borderColor: theme.warning, backgroundColor: '#fffbeb' },
            }}
          >
            {config.escalateLabel}
          </Button>
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
      </header>

      <div className="row g-4">
        {/* Main content — left column */}
        <div className="col-md-8">
          {/* Timeline */}
          <section className="mb-4">
            {timeline.length === 0 ? (
              <SupportEmptyState message="No messages yet" />
            ) : (
              <div>
                {timeline.map((message, index) => (
                  <SupportTimelineBlock
                    key={message.id || index}
                    message={message}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Response Composer */}
          <SupportResponseComposer onSubmit={handlePostResponse} />
        </div>

        {/* Sidebar — right column */}
        <div className="col-md-4">
          {/* Case Information */}
          <div className="card border rounded-3 p-3 mb-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.caseInfoTitle}
            </h6>

            <div className="d-flex flex-column">
              <InfoRow label={config.labelProduct} value={supportCase.product} theme={theme} />
              {supportCase.priority && (
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelPriority}
                  </span>
                  <SupportSeverityBadge severity={supportCase.priority} />
                </div>
              )}
              {supportCase.severity && (
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelSeverity}
                  </span>
                  <SupportSeverityBadge severity={supportCase.severity} />
                </div>
              )}
              <InfoRow label={config.labelModule} value={supportCase.module} theme={theme} />
              <InfoRow label={config.labelAccount} value={supportCase.account} theme={theme} />
            </div>
          </div>

          {/* Diagnostics Context */}
          <div className="card border rounded-3 p-3 mb-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.diagnosticsTitle}
            </h6>

            <div className="d-flex flex-column">
              {diagnostics.browser && (
                <div className="d-flex align-items-center gap-2 py-1">
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelBrowser}
                  </span>
                  <span
                    className="ms-auto fw-medium"
                    style={{ fontSize: '12px', color: theme.textPrimary }}
                  >
                    {diagnostics.browser}
                  </span>
                </div>
              )}
              {diagnostics.environment && (
                <div className="d-flex align-items-center gap-2 py-1">
                  <ComputerIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelEnvironment}
                  </span>
                  <span
                    className="ms-auto fw-medium"
                    style={{ fontSize: '12px', color: theme.textPrimary }}
                  >
                    {diagnostics.environment}
                  </span>
                </div>
              )}
              {diagnostics.os && (
                <div className="d-flex align-items-center gap-2 py-1">
                  <ComputerIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelOs}
                  </span>
                  <span
                    className="ms-auto fw-medium"
                    style={{ fontSize: '12px', color: theme.textPrimary }}
                  >
                    {diagnostics.os}
                  </span>
                </div>
              )}
              {diagnostics.region && (
                <div className="d-flex align-items-center gap-2 py-1">
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {config.labelRegion}
                  </span>
                  <span
                    className="ms-auto fw-medium"
                    style={{ fontSize: '12px', color: theme.textPrimary }}
                  >
                    {diagnostics.region}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Internal Resources */}
          {resources.length > 0 && (
            <div className="card border rounded-3 p-3">
              <h6
                className="text-uppercase fw-semibold mb-3"
                style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
              >
                {config.internalResourcesTitle}
              </h6>

              <div className="d-flex flex-column gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportCaseDetail;

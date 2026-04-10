import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
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
  SUPPORT_THEME,
  mergeDefaults,
} from '../defaults/support.defaults';

/* ── Helpers ──────────────────────────────────────────────────────── */

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

const buildFullTimeline = (supportCase, diagnostics, messages, config) => {
  const synthetic = [];
  const caseTimestamp = supportCase.created?.timestamp || supportCase.created_at;

  // 1. Case Created event
  const caseBody = [supportCase.summary, supportCase.details].filter(Boolean).join('\n\n');
  if (caseBody) {
    synthetic.push({
      id: '__case_created__',
      type: 'case_created',
      author_type: 'system',
      body: caseBody,
      created_at: caseTimestamp,
      _label: config.caseCreatedLabel,
    });
  }

  // 2. Diagnostics Attached event (only if snapshot has meaningful data)
  const hasDiagnostics = diagnostics && Object.keys(diagnostics).some(
    (key) => diagnostics[key] && typeof diagnostics[key] !== 'object'
  );
  if (hasDiagnostics) {
    synthetic.push({
      id: '__diagnostics_attached__',
      type: 'diagnostics_attached',
      author_type: 'system',
      created_at: caseTimestamp,
      _label: config.diagnosticsAttachedLabel,
    });
  }

  return [...synthetic, ...messages];
};

/* ── Styled ───────────────────────────────────────────────────────── */

const DiagTile = styled.div`
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/* ── Sub-components ───────────────────────────────────────────────── */

const SidebarSection = ({ title, children, theme, trailing }) => (
  <div className="card border p-3 mb-3">
    <div className="d-flex align-items-center justify-content-between mb-3">
      <p
        className="text-uppercase fw-semibold mb-0"
        style={{ fontSize: '10px', letterSpacing: '0.07em', color: theme.textMuted }}
      >
        {title}
      </p>
      {trailing}
    </div>
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

/* ── Main Component ───────────────────────────────────────────────── */

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
  const rawMessages = messages || supportCase.messages || [];
  const diagnostics = supportCase.diagnostics_snapshot || {};
  const resources = supportCase.resources || [];
  const caseStatusName = supportCase.status?.name || supportCase.status;
  const isClosed = caseStatusName === 'resolved' || caseStatusName === 'closed';

  const timeline = useMemo(
    () => buildFullTimeline(supportCase, diagnostics, rawMessages, config),
    [supportCase, diagnostics, rawMessages, config]
  );

  /* ── Handlers ─────────────────────────────────────────────── */

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

  const handleUpdateMetadata = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-update-metadata',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handleDiagnosticsView = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::diagnostics-view',
      payload: { context: { ...context, diagnostics_snapshot: diagnostics } },
    });
  };

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div {...props}>
      {/* Breadcrumb */}
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
        <header
          className="d-flex flex-row justify-content-between align-items-start mb-4 pb-3"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
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
                variant="contained"
                onClick={handleResolve}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: theme.primary,
                  color: theme.onPrimary,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: theme.primaryDim, boxShadow: 'none' },
                }}
              >
                {config.resolveLabel}
              </Button>
            </div>
          )}
        </header>

        <div className="row g-4">
          {/* ── Left column — timeline + composer ──────────── */}
          <div className="col-md-8">
            <section className="mb-4">
              {timeline.length === 0 ? (
                <SupportEmptyState message="No messages yet" />
              ) : (
                <div>
                  {timeline.map((message, index) => (
                    <SupportTimelineBlock
                      key={message.id || index}
                      message={message}
                      theme={theme}
                      context={context}
                      config={config}
                      itemOnAction={itemOnAction}
                    />
                  ))}
                </div>
              )}
            </section>

            {!isClosed && (
              <SupportResponseComposer
                onSubmit={handlePostResponse}
                theme={theme}
                config={config}
              />
            )}
          </div>

          {/* ── Right column — sidebar ─────────────────────── */}
          <div className="col-md-4">
            {/* Case Information */}
            <SidebarSection title={config.caseInfoTitle} theme={theme}>
              <InfoRow label={config.labelProduct} value={context?.productDisplayName} theme={theme} />
              {supportCase.priority && (
                <InfoRow label={config.labelPriority} theme={theme}>
                  <SupportSeverityBadge severity={supportCase.priority} />
                </InfoRow>
              )}
              {supportCase.severity && (
                <InfoRow label={config.labelSeverity} theme={theme}>
                  <SupportSeverityBadge severity={supportCase.severity} />
                </InfoRow>
              )}
              <InfoRow label={config.labelModule} value={supportCase.current_module} theme={theme} />
              <TruncatedIdRow label={config.labelAccount} value={context?.organizationId} theme={theme} />

              <button
                className="border-0 bg-transparent p-0 d-flex align-items-center gap-1 mt-3"
                style={{ fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}
                onClick={handleUpdateMetadata}
              >
                {config.updateMetadataLabel}
                <EditIcon sx={{ fontSize: 12 }} />
              </button>
            </SidebarSection>

            {/* Diagnostics Context — 2x2 tile grid */}
            {(diagnostics.browser || diagnostics.environment || diagnostics.os || diagnostics.region) && (
              <SidebarSection
                title={config.diagnosticsTitle}
                theme={theme}
                trailing={
                  <Tooltip title="View full diagnostics bundle" placement="top">
                    <IconButton size="small" onClick={handleDiagnosticsView} sx={{ padding: '2px' }}>
                      <InfoOutlinedIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    </IconButton>
                  </Tooltip>
                }
              >
                <div className="row g-2">
                  {diagnostics.browser && (
                    <div className="col-6">
                      <DiagTile style={{ backgroundColor: theme.infoContainer }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase' }}>
                          {config.labelBrowser}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textPrimary }}>
                          {diagnostics.browser}
                        </span>
                      </DiagTile>
                    </div>
                  )}
                  {diagnostics.environment && (
                    <div className="col-6">
                      <DiagTile style={{ backgroundColor: theme.secondaryContainer }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase' }}>
                          {config.labelEnvironment}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textPrimary }}>
                          {diagnostics.environment}
                        </span>
                      </DiagTile>
                    </div>
                  )}
                  {diagnostics.os && (
                    <div className="col-6">
                      <DiagTile style={{ backgroundColor: theme.surfaceContainerLow }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase' }}>
                          {config.labelOs}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textPrimary }}>
                          {diagnostics.os}
                        </span>
                      </DiagTile>
                    </div>
                  )}
                  {diagnostics.region && (
                    <div className="col-6">
                      <DiagTile style={{ backgroundColor: theme.surfaceContainerLow }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase' }}>
                          {config.labelRegion}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textPrimary }}>
                          {diagnostics.region}
                        </span>
                      </DiagTile>
                    </div>
                  )}
                </div>

                {diagnostics.notes && (
                  <div
                    className="mt-3 p-2 rounded-2"
                    style={{ backgroundColor: theme.warningContainer, fontSize: '12px', color: theme.textSecondary }}
                  >
                    <span className="fw-semibold d-block mb-1" style={{ fontSize: '10px', color: theme.textMuted }}>
                      Note
                    </span>
                    {diagnostics.notes}
                  </div>
                )}
              </SidebarSection>
            )}

            {/* Internal Resources */}
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

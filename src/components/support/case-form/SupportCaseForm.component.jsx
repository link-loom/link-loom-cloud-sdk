import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import SendIcon from '@mui/icons-material/Send';
import LanguageIcon from '@mui/icons-material/Language';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  SUPPORT_CASE_FORM_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';
import BackButton from '../../shared/BackButton.component';
import { parseDiagnosticsFromNavigator } from '../shared/diagnostics.utils';

const DiagnosticRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
`;

const SectionLabel = styled.h6.attrs({ className: 'text-uppercase fw-semibold' })`
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: ${(props) => props.$color || '#6b7280'};
  margin-bottom: 0.75rem;
`;

const SupportCaseForm = ({
  ui,
  namespace,
  categories,
  context,
  itemOnAction,
  ...props
}) => {
  // Hooks
  const config = mergeDefaults(SUPPORT_CASE_FORM_DEFAULTS, ui);
  const theme = config.theme;

  // Models / State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState('low');
  const [businessImpact, setBusinessImpact] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configs
  const clientDiagnostics = useMemo(() => parseDiagnosticsFromNavigator(), []);
  const enrichedContext = useMemo(() => ({
    ...context,
    browser: context?.browser || clientDiagnostics.browser,
    os: context?.os || clientDiagnostics.os,
  }), [context, clientDiagnostics]);

  // Component Functions
  const handleSeverityChange = (event, newSeverity) => {
    if (newSeverity !== null) setSeverity(newSeverity);
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !itemOnAction) return;

    setIsSubmitting(true);

    const caseData = {
      category_id: selectedCategory?.id || null,
      category_name: selectedCategory?.name || selectedCategory?.title || null,
      summary: summary.trim(),
      details: details.trim(),
      severity,
      business_impact: businessImpact.trim(),
      browser: enrichedContext.browser,
      os: enrichedContext.os,
      context: enrichedContext,
    };

    await itemOnAction({
      action: 'link-loom-support::case-create',
      namespace: 'link-loom-support',
      payload: { caseData },
    });

    setIsSubmitting(false);
  };

  // Configs
  const categoryOptions = (categories || []).map((cat) => ({
    ...cat,
    label: cat.title || cat.name || 'Unknown',
  }));

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  // Render
  return (
    <article className="card shadow" {...props}>
      <section className="card-body">
        <BackButton onClick={() => emit('back-to-hub')}>Back to Support Hub</BackButton>

        <header className="d-flex flex-row justify-content-between mb-3">
          <section>
            <h4 className="mt-0 mb-1">{config.title}</h4>
            <p className="text-muted font-14 mb-3">{config.subtitle}</p>
          </section>
        </header>

      <div className="row g-4">
        {/* ── Main Form Column ─────────────────────────────── */}
        <div className="col-md-8">
          <div className="d-flex flex-column gap-4">

            {/* Problem Classification */}
            <Autocomplete
              options={categoryOptions}
              getOptionLabel={(option) => option.label || ''}
              value={selectedCategory}
              onChange={(event, newValue) => setSelectedCategory(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={config.classificationLabel}
                  placeholder={config.classificationPlaceholder}
                  size="small"
                  fullWidth
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />

            {/* Issue Summary */}
            <TextField
              label={config.summaryLabel}
              placeholder={config.summaryPlaceholder}
              size="small"
              fullWidth
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />

            {/* Issue Details */}
            <TextField
              label={config.detailsLabel}
              placeholder={config.detailsPlaceholder}
              size="small"
              fullWidth
              multiline
              rows={5}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />

            {/* Severity Level */}
            <div>
              <SectionLabel $color={theme.textMuted}>{config.severityLabel}</SectionLabel>
              <ToggleButtonGroup
                value={severity}
                exclusive
                onChange={handleSeverityChange}
                size="small"
                sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontSize: '0.8rem', fontWeight: 500 } }}
              >
                {config.severityOptions.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: `${option.color}15`,
                        color: option.color,
                        borderColor: `${option.color} !important`,
                        '&:hover': { backgroundColor: `${option.color}25` },
                      },
                    }}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>

            {/* Business Impact */}
            <TextField
              label={config.businessImpactLabel}
              placeholder={config.businessImpactPlaceholder}
              size="small"
              fullWidth
              multiline
              rows={3}
              value={businessImpact}
              onChange={(event) => setBusinessImpact(event.target.value)}
            />

            {/* Submit */}
            <div>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!summary.trim() || isSubmitting}
                endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: theme.brandPrimary,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#334155', boxShadow: 'none' },
                  '&:disabled': { backgroundColor: theme.border },
                  px: 3,
                  py: 1.1,
                }}
              >
                {config.submitLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Sidebar Column ───────────────────────────────── */}
        <div className="col-md-4">

          {/* Diagnostics Summary */}
          <div className="card border p-3 mb-3">
            <SectionLabel $color={theme.textMuted}>{config.diagnosticsTitle}</SectionLabel>
            <div className="d-flex flex-column">
              {enrichedContext?.environment && (
                <DiagnosticRow>
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Environment</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {enrichedContext.environment}
                  </span>
                </DiagnosticRow>
              )}
              {enrichedContext?.browser && (
                <DiagnosticRow>
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Browser</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {enrichedContext.browser}
                  </span>
                </DiagnosticRow>
              )}
              {enrichedContext?.os && (
                <DiagnosticRow>
                  <ComputerIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>OS</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {enrichedContext.os}
                  </span>
                </DiagnosticRow>
              )}
              {enrichedContext?.userId && (
                <DiagnosticRow>
                  <PersonIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>User</span>
                  <span
                    className="ms-auto fw-medium text-truncate"
                    style={{ color: theme.textPrimary, maxWidth: '120px' }}
                  >
                    {enrichedContext.userId}
                  </span>
                </DiagnosticRow>
              )}
              {enrichedContext?.organizationId && (
                <DiagnosticRow>
                  <BusinessIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Organization</span>
                  <span
                    className="ms-auto fw-medium text-truncate"
                    style={{ color: theme.textPrimary, maxWidth: '120px' }}
                  >
                    {enrichedContext.organizationId}
                  </span>
                </DiagnosticRow>
              )}
            </div>

            {enrichedContext?.recentError && (
              <div className="mt-3 p-2 rounded-2" style={{ backgroundColor: '#fef2f2' }}>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <ErrorOutlineIcon sx={{ fontSize: 14, color: theme.error }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: theme.error }}>
                    Recent Error
                  </span>
                </div>
                <p
                  className="mb-0"
                  style={{ fontSize: '11px', color: theme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {enrichedContext.recentError}
                </p>
              </div>
            )}
          </div>

          {/* Related Knowledge Base */}
          <div className="card border p-3">
            <SectionLabel $color={theme.textMuted}>{config.relatedKbTitle}</SectionLabel>
            {(!enrichedContext?.relatedArticles || enrichedContext.relatedArticles.length === 0) ? (
              <p className="mb-0" style={{ fontSize: '12px', color: theme.textMuted }}>
                {config.noRelatedKb}
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {enrichedContext.relatedArticles.map((article, index) => (
                  <div
                    key={article.id || index}
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <MenuBookIcon sx={{ fontSize: 14, color: theme.brandAccent }} />
                    <span style={{ fontSize: '12px', color: theme.brandAccent }}>{article.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
    </article>
  );
};

export default SupportCaseForm;

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import ComputerIcon from '@mui/icons-material/Computer';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  SUPPORT_CASE_FORM_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const SeverityButton = styled('button')(({ $active, $color }) => ({
  flex: 1,
  padding: '8px 12px',
  border: `1px solid ${$active ? $color : '#e2e8f0'}`,
  borderRadius: '6px',
  backgroundColor: $active ? `${$color}10` : 'transparent',
  color: $active ? $color : '#6B7280',
  fontSize: '13px',
  fontWeight: $active ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.15s',
  '&:hover': {
    borderColor: $color,
    color: $color,
  },
}));

const DropzoneArea = styled('div')(({ $borderColor }) => ({
  border: `2px dashed ${$borderColor || '#e2e8f0'}`,
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
  },
}));

const DiagnosticRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 0',
  fontSize: '12px',
});

const SupportCaseForm = ({
  ui,
  namespace,
  categories,
  context,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_CASE_FORM_DEFAULTS, ui);
  const theme = config.theme;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [businessImpact, setBusinessImpact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      context: context || {},
    };

    await itemOnAction({
      action: 'link-loom-support::case-create',
      namespace: 'link-loom-support',
      payload: { caseData },
    });

    setIsSubmitting(false);
  };

  const categoryOptions = (categories || []).map((cat) => ({
    ...cat,
    label: cat.title || cat.name || 'Unknown',
  }));

  return (
    <div {...props}>
      {/* Header */}
      <header className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: theme.textPrimary }}>
          {config.title}
        </h3>
        <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
          {config.subtitle}
        </p>
      </header>

      <div className="row g-4">
        {/* Form — left column */}
        <div className="col-md-8">
          <div className="d-flex flex-column gap-4">
            {/* Problem Classification */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.classificationLabel}
              </label>
              <Autocomplete
                options={categoryOptions}
                getOptionLabel={(option) => option.label || ''}
                value={selectedCategory}
                onChange={(event, newValue) => setSelectedCategory(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={config.classificationPlaceholder}
                    size="small"
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </div>

            {/* Issue Summary */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.summaryLabel}
              </label>
              <TextField
                placeholder={config.summaryPlaceholder}
                size="small"
                fullWidth
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </div>

            {/* Issue Details */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.detailsLabel}
              </label>
              <TextField
                placeholder={config.detailsPlaceholder}
                size="small"
                fullWidth
                multiline
                rows={5}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </div>

            {/* Severity Level */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.severityLabel}
              </label>
              <div className="d-flex gap-2">
                {config.severityOptions.map((option) => (
                  <SeverityButton
                    key={option.value}
                    type="button"
                    $active={severity === option.value}
                    $color={option.color}
                    onClick={() => setSeverity(option.value)}
                  >
                    {option.label}
                  </SeverityButton>
                ))}
              </div>
            </div>

            {/* Business Impact */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.businessImpactLabel}
              </label>
              <TextField
                placeholder={config.businessImpactPlaceholder}
                size="small"
                fullWidth
                multiline
                rows={3}
                value={businessImpact}
                onChange={(event) => setBusinessImpact(event.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </div>

            {/* Attachments */}
            <div>
              <label
                className="form-label fw-semibold"
                style={{ fontSize: '13px', color: theme.textPrimary }}
              >
                {config.attachmentsLabel}
              </label>
              <DropzoneArea $borderColor={theme.border}>
                <CloudUploadIcon
                  sx={{ fontSize: 32, color: theme.textMuted, mb: 1 }}
                />
                <p
                  className="mb-0"
                  style={{ fontSize: '13px', color: theme.textSecondary }}
                >
                  {config.attachmentsHint}
                </p>
              </DropzoneArea>
            </div>

            {/* Submit */}
            <div>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!summary.trim() || isSubmitting}
                endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: theme.brandPrimary,
                  '&:hover': { backgroundColor: '#334155' },
                  '&:disabled': { backgroundColor: theme.border },
                  px: 3,
                  py: 1,
                }}
              >
                {config.submitLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar — right column */}
        <div className="col-md-4">
          {/* Diagnostics Summary */}
          <div className="card border rounded-3 p-3 mb-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.diagnosticsTitle}
            </h6>

            <div className="d-flex flex-column">
              {context?.environment && (
                <DiagnosticRow>
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Environment</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.environment}
                  </span>
                </DiagnosticRow>
              )}
              {context?.browser && (
                <DiagnosticRow>
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Browser</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.browser}
                  </span>
                </DiagnosticRow>
              )}
              {context?.os && (
                <DiagnosticRow>
                  <ComputerIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>OS</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.os}
                  </span>
                </DiagnosticRow>
              )}
              {context?.userId && (
                <DiagnosticRow>
                  <PersonIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>User</span>
                  <span
                    className="ms-auto fw-medium text-truncate"
                    style={{ color: theme.textPrimary, maxWidth: '120px' }}
                  >
                    {context.userId}
                  </span>
                </DiagnosticRow>
              )}
              {context?.organizationId && (
                <DiagnosticRow>
                  <BusinessIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Organization</span>
                  <span
                    className="ms-auto fw-medium text-truncate"
                    style={{ color: theme.textPrimary, maxWidth: '120px' }}
                  >
                    {context.organizationId}
                  </span>
                </DiagnosticRow>
              )}
            </div>

            {context?.recentError && (
              <div className="mt-3 p-2 rounded-2" style={{ backgroundColor: '#fef2f2' }}>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <ErrorOutlineIcon sx={{ fontSize: 14, color: theme.error }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: theme.error }}>
                    Recent Error
                  </span>
                </div>
                <p
                  className="mb-0"
                  style={{
                    fontSize: '11px',
                    color: theme.textSecondary,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {context.recentError}
                </p>
              </div>
            )}
          </div>

          {/* Related Knowledge Base */}
          <div className="card border rounded-3 p-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.relatedKbTitle}
            </h6>

            {(!context?.relatedArticles || context.relatedArticles.length === 0) ? (
              <p className="mb-0" style={{ fontSize: '12px', color: theme.textMuted }}>
                {config.noRelatedKb}
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {context.relatedArticles.map((article, index) => (
                  <div
                    key={article.id || index}
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <MenuBookIcon sx={{ fontSize: 14, color: theme.brandAccent }} />
                    <span style={{ fontSize: '12px', color: theme.brandAccent }}>
                      {article.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCaseForm;

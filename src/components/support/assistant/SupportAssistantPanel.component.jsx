import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AppsIcon from '@mui/icons-material/Apps';
import LayersIcon from '@mui/icons-material/Layers';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import {
  SUPPORT_ASSISTANT_DEFAULTS,
  mergeDefaults,
} from '../defaults/support.defaults';

const ChatBubble = styled('div')(({ $isSystem, $bgColor }) => ({
  maxWidth: '85%',
  padding: '10px 14px',
  borderRadius: '12px',
  fontSize: '13px',
  lineHeight: 1.6,
  backgroundColor: $bgColor || ($isSystem ? '#f8fafc' : '#eff6ff'),
  border: `1px solid ${$isSystem ? '#e2e8f0' : '#bfdbfe'}`,
  whiteSpace: 'pre-wrap',
}));

const ContextCard = styled('div')({
  fontSize: '12px',
});

const SupportAssistantPanel = ({
  ui,
  namespace,
  context,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_ASSISTANT_DEFAULTS, ui);
  const theme = config.theme;

  const [chatMessages, setChatMessages] = useState([
    {
      id: 'system-greeting',
      role: 'assistant',
      content: config.systemGreeting,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    if (itemOnAction) {
      await itemOnAction({
        action: 'link-loom-support::assistant-message',
        namespace: 'link-loom-support',
        payload: {
          message: userMessage.content,
          context,
          history: [...chatMessages, userMessage],
        },
      });
    }

    setIsSending(false);
  };

  const handleSuggestedAction = (action) => {
    setInputValue(action.label);
  };

  const handleEscalate = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::assistant-escalate',
      namespace: 'link-loom-support',
      payload: { context, chatHistory: chatMessages },
    });
  };

  const handleViewBundle = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::diagnostics-view',
      namespace: 'link-loom-support',
      payload: { context },
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

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
        {/* Chat area — left column */}
        <div className="col-md-8">
          {/* Messages */}
          <div
            className="d-flex flex-column gap-3 mb-3"
            style={{ minHeight: '300px' }}
          >
            {chatMessages.map((message) => {
              const isAssistant = message.role === 'assistant';

              return (
                <div
                  key={message.id}
                  className={`d-flex gap-2 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '12px',
                      backgroundColor: isAssistant ? '#8b5cf6' : theme.brandPrimary,
                      flexShrink: 0,
                    }}
                  >
                    {isAssistant ? (
                      <SmartToyIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 14 }} />
                    )}
                  </Avatar>
                  <ChatBubble
                    $isSystem={isAssistant}
                    $bgColor={isAssistant ? '#f8fafc' : '#eff6ff'}
                  >
                    {message.content}
                  </ChatBubble>
                </div>
              );
            })}
          </div>

          {/* Suggested Actions */}
          {chatMessages.length <= 1 && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              {config.suggestedActions.map((action) => (
                <Chip
                  key={action.key}
                  label={action.label}
                  variant="outlined"
                  clickable
                  onClick={() => handleSuggestedAction(action)}
                  sx={{
                    fontSize: '12px',
                    borderColor: theme.border,
                    color: theme.textSecondary,
                    '&:hover': {
                      borderColor: '#8b5cf6',
                      color: '#8b5cf6',
                      backgroundColor: '#f5f3ff',
                    },
                  }}
                />
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="border rounded-3 p-3"
            style={{ borderColor: theme.border }}
          >
            <textarea
              className="form-control border-0 p-0 mb-2"
              rows={3}
              placeholder={config.inputPlaceholder}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              style={{
                resize: 'none',
                fontSize: '13px',
                color: theme.textPrimary,
                backgroundColor: 'transparent',
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            <div
              className="d-flex align-items-center justify-content-between pt-2"
              style={{ borderTop: `1px solid ${theme.border}` }}
            >
              <IconButton size="small" sx={{ color: theme.textMuted }}>
                <AttachFileIcon fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="contained"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                endIcon={<SendIcon sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: theme.brandPrimary,
                  '&:hover': { backgroundColor: '#334155' },
                  '&:disabled': { backgroundColor: theme.border },
                }}
              >
                {config.sendLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar — right column */}
        <div className="col-md-4">
          {/* Session Context */}
          <div className="card border rounded-3 p-3 mb-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.sessionContextTitle}
            </h6>

            <div className="d-flex flex-column gap-2">
              {context?.product && (
                <ContextCard className="d-flex align-items-center gap-2">
                  <AppsIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Product</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.product}
                  </span>
                </ContextCard>
              )}
              {context?.module && (
                <ContextCard className="d-flex align-items-center gap-2">
                  <LayersIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Module</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.module}
                  </span>
                </ContextCard>
              )}
              {context?.environment && (
                <ContextCard className="d-flex align-items-center gap-2">
                  <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Environment</span>
                  <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                    {context.environment}
                  </span>
                </ContextCard>
              )}
              {context?.organizationId && (
                <ContextCard className="d-flex align-items-center gap-2">
                  <BusinessIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                  <span style={{ color: theme.textSecondary }}>Organization</span>
                  <span
                    className="ms-auto fw-medium text-truncate"
                    style={{ color: theme.textPrimary, maxWidth: '120px' }}
                  >
                    {context.organizationId}
                  </span>
                </ContextCard>
              )}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="card border rounded-3 p-3 mb-3">
            <h6
              className="text-uppercase fw-semibold mb-3"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
            >
              {config.diagnosticsTitle}
            </h6>

            <div className="d-flex align-items-center gap-2 mb-2">
              <CheckCircleIcon sx={{ fontSize: 16, color: theme.success }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: theme.success }}>
                {config.diagnosticsReady}
              </span>
            </div>
            <p className="mb-2" style={{ fontSize: '12px', color: theme.textSecondary }}>
              {config.diagnosticsBundle}
            </p>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
              onClick={handleViewBundle}
              sx={{
                textTransform: 'none',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                borderColor: theme.border,
                color: theme.textSecondary,
                '&:hover': { borderColor: theme.textSecondary },
              }}
            >
              {config.viewBundleLabel}
            </Button>
          </div>

          {/* Escalation */}
          <div
            className="card border rounded-3 p-3"
            style={{ borderColor: theme.warning, backgroundColor: '#fffbeb' }}
          >
            <h6
              className="fw-semibold mb-1"
              style={{ fontSize: '13px', color: theme.textPrimary }}
            >
              {config.escalationTitle}
            </h6>
            <p className="mb-2" style={{ fontSize: '12px', color: theme.textSecondary }}>
              {config.escalationDescription}
            </p>
            <Button
              size="small"
              variant="outlined"
              startIcon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
              onClick={handleEscalate}
              sx={{
                textTransform: 'none',
                fontSize: '12px',
                fontWeight: 500,
                borderColor: theme.warning,
                color: theme.warning,
                '&:hover': {
                  borderColor: theme.warning,
                  backgroundColor: '#fef3c7',
                },
              }}
            >
              {config.escalationAction}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAssistantPanel;

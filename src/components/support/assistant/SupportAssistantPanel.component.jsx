import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { styled as muiStyled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
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
import BackButton from '../../shared/BackButton.component';

// ── Styled ────────────────────────────────────────────────────────────

const MessageArea = styled.div`
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
`;

const FallbackBubble = muiStyled('div')(({ $isAssistant }) => ({
  maxWidth: '85%',
  padding: '10px 14px',
  borderRadius: '12px',
  fontSize: '13px',
  lineHeight: 1.6,
  backgroundColor: $isAssistant ? '#f8fafc' : '#eff6ff',
  border: `1px solid ${$isAssistant ? '#e2e8f0' : '#bfdbfe'}`,
  whiteSpace: 'pre-wrap',
}));

const ContextRow = muiStyled('div')({ fontSize: '12px' });

const EscalationCard = styled.div.attrs({ className: 'card p-3' })`
  border: 1px solid ${({ $borderColor }) => $borderColor} !important;
  background-color: #fffbeb;
`;

// ── Component ─────────────────────────────────────────────────────────

const SupportAssistantPanel = ({
  ui,
  namespace,
  context,
  itemOnAction,
  executionService,
  llmProviders,
  components,
  ...props
}) => {
  // Hooks
  const config = mergeDefaults(SUPPORT_ASSISTANT_DEFAULTS, ui);
  const theme = config.theme;

  // Components (injected from client via @sommatic/react-sdk)
  const CognitiveEntry = components?.CognitiveEntry || null;
  const ChatBubbleComponent = components?.ChatBubble || null;
  const SystemResponseComponent = components?.SystemResponse || null;

  // Models / State
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [fallbackInput, setFallbackInput] = useState('');

  // Refs
  const messageAreaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Component Functions
  const scrollToBottom = () => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSendMessage = async (query, provider) => {
    if (!query?.trim() || !executionService) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingText('');
    setCanSendMessage(false);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const selectedProvider = provider || llmProviders?.[0];

    if (!selectedProvider?.id) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'No LLM provider available. Please check your configuration.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsStreaming(false);
      setCanSendMessage(true);
      return;
    }

    let accumulated = '';

    await executionService.executeEphemeralStream(
      {
        llm_provider_id: selectedProvider.id,
        organization_id: context?.organizationId || null,
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        support_context: {
          product: context?.product || namespace?.title || null,
          productName: context?.productDisplayName || namespace?.title || null,
          environment: context?.environment || null,
          organizationId: context?.organizationId || null,
        },
      },
      {
        onChunk: (data) => {
          accumulated += data.text || '';
          setStreamingText(accumulated);
        },
        onDone: () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: accumulated,
              timestamp: new Date().toISOString(),
            },
          ]);
          setStreamingText('');
          setIsStreaming(false);
          setCanSendMessage(true);
        },
        onError: (error) => {
          const errorText = accumulated || error?.message || 'An error occurred while processing your request.';
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: errorText,
              timestamp: new Date().toISOString(),
            },
          ]);
          setStreamingText('');
          setIsStreaming(false);
          setCanSendMessage(true);
        },
        signal: abortController.signal,
      },
    );
  };

  const handleCognitiveEntryAction = (action, payload) => {
    if (action === 'cognitive-entry::on-message') {
      handleSendMessage(payload?.query, payload?.provider);
    }
  };

  const handleFallbackSubmit = () => {
    if (!fallbackInput.trim()) return;
    handleSendMessage(fallbackInput.trim());
    setFallbackInput('');
  };

  const handleFallbackKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleFallbackSubmit();
    }
  };

  const handleSuggestedAction = (action) => {
    if (CognitiveEntry) return;
    setFallbackInput(action.label);
  };

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  // Render helpers
  const renderMessage = (message) => {
    const isAssistant = message.role === 'assistant';

    if (isAssistant && SystemResponseComponent) {
      return <SystemResponseComponent>{message.content}</SystemResponseComponent>;
    }

    if (!isAssistant && ChatBubbleComponent) {
      return <ChatBubbleComponent role="user">{message.content}</ChatBubbleComponent>;
    }

    return (
      <FallbackBubble $isAssistant={isAssistant}>
        {message.content}
      </FallbackBubble>
    );
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
          {/* Chat area — left column */}
          <div className="col-md-8">
            {/* Messages */}
            <MessageArea ref={messageAreaRef} className="d-flex flex-column gap-3 mb-3">
              {/* System greeting */}
              {messages.length === 0 && !isStreaming && (
                <div className="d-flex gap-2">
                  <Avatar
                    sx={{
                      width: 28, height: 28, fontSize: '12px',
                      backgroundColor: '#8b5cf6', flexShrink: 0,
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <FallbackBubble $isAssistant>
                    {config.systemGreeting}
                  </FallbackBubble>
                </div>
              )}

              {messages.map((message) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div
                    key={message.id}
                    className={`d-flex gap-2 ${isAssistant ? '' : 'flex-row-reverse'}`}
                  >
                    <Avatar
                      sx={{
                        width: 28, height: 28, fontSize: '12px',
                        backgroundColor: isAssistant ? '#8b5cf6' : theme.brandPrimary,
                        flexShrink: 0,
                      }}
                    >
                      {isAssistant
                        ? <SmartToyIcon sx={{ fontSize: 14 }} />
                        : <PersonIcon sx={{ fontSize: 14 }} />}
                    </Avatar>
                    {renderMessage(message)}
                  </div>
                );
              })}

              {/* Streaming response */}
              {isStreaming && streamingText && (
                <div className="d-flex gap-2">
                  <Avatar
                    sx={{
                      width: 28, height: 28, fontSize: '12px',
                      backgroundColor: '#8b5cf6', flexShrink: 0,
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  {SystemResponseComponent
                    ? <SystemResponseComponent isSynthesizing>{streamingText}</SystemResponseComponent>
                    : <FallbackBubble $isAssistant>{streamingText}</FallbackBubble>}
                </div>
              )}

              {isStreaming && !streamingText && (
                <div className="d-flex gap-2">
                  <Avatar
                    sx={{
                      width: 28, height: 28, fontSize: '12px',
                      backgroundColor: '#8b5cf6', flexShrink: 0,
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  {SystemResponseComponent
                    ? <SystemResponseComponent isSynthesizing>{''}</SystemResponseComponent>
                    : <FallbackBubble $isAssistant>Thinking...</FallbackBubble>}
                </div>
              )}
            </MessageArea>

            {/* Suggested Actions */}
            {messages.length === 0 && !isStreaming && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {config.suggestedActions.map((action) => (
                  <Chip
                    key={action.key}
                    label={action.label}
                    variant="outlined"
                    clickable
                    onClick={() => {
                      handleSuggestedAction(action);
                      if (CognitiveEntry) {
                        handleSendMessage(action.label, llmProviders?.[0]);
                      }
                    }}
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

            {/* Chat Input */}
            {CognitiveEntry ? (
              <CognitiveEntry
                entitySelected={null}
                canSendMessage={canSendMessage}
                setCanSendMessage={setCanSendMessage}
                fullWidth
                itemOnAction={handleCognitiveEntryAction}
              />
            ) : (
              <div
                className="border rounded-3 p-3"
                style={{ borderColor: theme.border }}
              >
                <textarea
                  className="form-control border-0 p-0 mb-2"
                  rows={3}
                  placeholder={config.inputPlaceholder}
                  value={fallbackInput}
                  onChange={(event) => setFallbackInput(event.target.value)}
                  onKeyDown={handleFallbackKeyDown}
                  disabled={isStreaming}
                  style={{
                    resize: 'none',
                    fontSize: '13px',
                    color: theme.textPrimary,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
                <div className="d-flex justify-content-end pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleFallbackSubmit}
                    disabled={!fallbackInput.trim() || isStreaming}
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
            )}
          </div>

          {/* Sidebar — right column */}
          <div className="col-md-4">
            {/* Session Context */}
            <div className="card border p-3 mb-3">
              <h6
                className="text-uppercase fw-semibold mb-3"
                style={{ fontSize: '11px', letterSpacing: '0.05em', color: theme.textMuted }}
              >
                {config.sessionContextTitle}
              </h6>

              <div className="d-flex flex-column gap-2">
                {context?.product && (
                  <ContextRow className="d-flex align-items-center gap-2">
                    <AppsIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ color: theme.textSecondary }}>Product</span>
                    <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                      {context.product}
                    </span>
                  </ContextRow>
                )}
                {context?.module && (
                  <ContextRow className="d-flex align-items-center gap-2">
                    <LayersIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ color: theme.textSecondary }}>Module</span>
                    <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                      {context.module}
                    </span>
                  </ContextRow>
                )}
                {context?.environment && (
                  <ContextRow className="d-flex align-items-center gap-2">
                    <LanguageIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ color: theme.textSecondary }}>Environment</span>
                    <span className="ms-auto fw-medium" style={{ color: theme.textPrimary }}>
                      {context.environment}
                    </span>
                  </ContextRow>
                )}
                {context?.organizationId && (
                  <ContextRow className="d-flex align-items-center gap-2">
                    <BusinessIcon sx={{ fontSize: 14, color: theme.textMuted }} />
                    <span style={{ color: theme.textSecondary }}>Organization</span>
                    <span
                      className="ms-auto fw-medium text-truncate"
                      style={{ color: theme.textPrimary, maxWidth: '120px' }}
                    >
                      {context.organizationId}
                    </span>
                  </ContextRow>
                )}
              </div>
            </div>

            {/* Diagnostics */}
            <div className="card border p-3 mb-3">
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
                onClick={() => emit('diagnostics-view', { context })}
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
            <EscalationCard $borderColor={theme.warning}>
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
                onClick={() => emit('assistant-escalate', { context, chatHistory: messages })}
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
            </EscalationCard>
          </div>
        </div>
      </section>
    </article>
  );
};

export default SupportAssistantPanel;

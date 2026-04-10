import React from 'react';
import styled from 'styled-components';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { SUPPORT_THEME } from '../defaults/support.defaults';

/* ── Helpers ──────────────────────────────────────────────────────── */

const formatTimelineDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    const raw = typeof timestamp === 'string' ? parseInt(timestamp, 10) : Number(timestamp);
    const date = new Date(raw);
    if (isNaN(date.getTime())) return '';
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${month} ${day} • ${time}`;
  } catch {
    return '';
  }
};

const resolveAuthorName = (message, context) => {
  if (message.author_name) return message.author_name;
  if (message.author_user_id && context?.userId && message.author_user_id === context.userId) {
    return context.userDisplayName || 'You';
  }
  const authorType = (message.author_type || '').toLowerCase();
  if (authorType === 'agent' || authorType === 'bot') return 'Support';
  if (authorType === 'system') return 'System';
  return 'You';
};

const getEventType = (message) => {
  if (message.type) return message.type;
  const msgType = (message.message_type || '').toLowerCase();
  if (msgType === 'status_change') return 'status_change';
  return 'reply';
};

const getDotColor = (message, theme) => {
  const eventType = getEventType(message);
  if (eventType === 'case_created' || eventType === 'diagnostics_attached') return theme.info;
  const authorType = (message.author_type || '').toLowerCase();
  if (authorType === 'system' || authorType === 'bot') return theme.info;
  if (authorType === 'agent') return theme.success;
  return theme.primary;
};

const isAgentMessage = (message) => {
  const authorType = (message.author_type || '').toLowerCase();
  return authorType === 'agent' || authorType === 'bot';
};

/* ── Styled ───────────────────────────────────────────────────────── */

const TimelineEntry = styled.div`
  position: relative;
  padding-left: 28px;
  padding-bottom: 24px;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 24px;
    bottom: 0;
    width: 2px;
    background-color: ${(props) => props.$borderColor || '#e2e8f0'};
  }

  &:last-child::before {
    display: none;
  }
`;

const TimelineDot = styled.div`
  position: absolute;
  left: 0;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => props.$color || '#585e6c'};
`;

const EventCard = styled.div`
  border: 1px solid ${(props) => props.$borderColor || '#e2e8f0'};
  border-radius: 8px;
  padding: 12px 16px;
  background: #ffffff;
  ${(props) => props.$accentColor && `border-left: 3px solid ${props.$accentColor};`}
`;

const MarkdownBody = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: ${(props) => props.$color || '#283439'};

  p { margin: 0 0 0.5em; }
  p:last-child { margin-bottom: 0; }
  strong { font-weight: 600; }
  code {
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 3px;
    background-color: #f1f5f9;
  }
  pre {
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: #f1f5f9;
    overflow-x: auto;
  }
  pre code { padding: 0; background: none; }
  ul, ol { margin: 0.25em 0; padding-left: 1.5em; }
  a { color: #2B6CB0; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

const renderBody = (content, color) => {
  if (!content) return null;
  return (
    <MarkdownBody $color={color}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </MarkdownBody>
  );
};

const DateLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${(props) => props.$color || '#718096'};
  letter-spacing: 0.03em;
  display: block;
  margin-bottom: 8px;
`;

/* ── Component ────────────────────────────────────────────────────── */

const SupportTimelineBlock = ({
  message,
  theme = SUPPORT_THEME,
  context,
  config = {},
  itemOnAction,
  ...props
}) => {
  if (!message) return null;

  const eventType = getEventType(message);
  const dotColor = getDotColor(message, theme);
  const timestamp = message.created_at || message.timestamp;
  const dateLabel = formatTimelineDate(timestamp);

  /* ── Role label ─────────────────────────────────────── */

  const renderRoleLabel = () => {
    if (eventType === 'case_created' || eventType === 'diagnostics_attached' || eventType === 'status_change') return null;
    const authorType = (message.author_type || '').toLowerCase();
    if (authorType === 'agent' || authorType === 'bot') return 'SUPPORT SPECIALIST';
    if (authorType === 'customer' || authorType === 'requester') return 'YOU';
    return null;
  };

  /* ── Event type renderers ───────────────────────────── */

  const renderCaseCreated = () => (
    <EventCard $borderColor={theme.border}>
      <span className="fw-semibold d-block mb-2" style={{ fontSize: '13px', color: theme.textPrimary }}>
        {message._label || config.caseCreatedLabel || 'Case Created'}
      </span>
      {renderBody(message.body || message.content, theme.textSecondary)}
    </EventCard>
  );

  const renderDiagnosticsAttached = () => (
    <EventCard $borderColor={theme.border}>
      <div className="d-flex align-items-center justify-content-between">
        <span className="fw-semibold" style={{ fontSize: '13px', color: theme.textPrimary }}>
          {message._label || config.diagnosticsAttachedLabel || 'Diagnostics Attached'}
        </span>
        <Button
          size="small"
          variant="text"
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
          onClick={() => {
            if (!itemOnAction) return;
            itemOnAction({
              action: 'link-loom-support::diagnostics-view',
              payload: { context },
            });
          }}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 500,
            color: theme.textSecondary,
            '&:hover': { color: theme.textPrimary, backgroundColor: 'transparent' },
          }}
        >
          {config.viewAnalysisLabel || 'View Analysis'}
        </Button>
      </div>
    </EventCard>
  );

  const renderStatusChange = () => (
    <div className="d-flex align-items-center gap-2 py-1">
      <span style={{ fontSize: '12px', color: theme.textMuted, fontStyle: 'italic' }}>
        {message.body || message.content}
      </span>
    </div>
  );

  const renderReply = () => {
    const authorName = resolveAuthorName(message, context);
    const isAgent = isAgentMessage(message);

    return (
      <EventCard
        $borderColor={theme.border}
        $accentColor={isAgent ? theme.success : undefined}
      >
        {/* Author header */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: '12px',
              backgroundColor: isAgent ? theme.success : theme.primary,
            }}
          >
            {isAgent
              ? <SmartToyIcon sx={{ fontSize: 14 }} />
              : <PersonIcon sx={{ fontSize: 14 }} />
            }
          </Avatar>
          <span className="fw-semibold" style={{ fontSize: '13px', color: theme.textPrimary }}>
            {authorName}
          </span>
          {message.author_role && (
            <Chip
              label={message.author_role}
              size="small"
              sx={{
                height: '18px',
                fontSize: '10px',
                fontWeight: 500,
                backgroundColor: theme.surfaceSecondary,
                color: theme.textSecondary,
              }}
            />
          )}
        </div>

        {/* Body */}
        {renderBody(message.body || message.content, theme.textPrimary)}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment, index) => (
              <Chip
                key={attachment.id || index}
                icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                label={attachment.name || attachment.filename || `Attachment ${index + 1}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '11px',
                  borderColor: theme.border,
                  color: theme.textSecondary,
                }}
              />
            ))}
          </div>
        )}
      </EventCard>
    );
  };

  /* ── Render ─────────────────────────────────────────── */

  const roleLabel = renderRoleLabel();

  return (
    <TimelineEntry $borderColor={theme.border} {...props}>
      <TimelineDot $color={dotColor} />

      {/* Date + role label */}
      {dateLabel && (
        <DateLabel $color={theme.textMuted}>
          {dateLabel}
          {roleLabel && (
            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>
              • {roleLabel}
            </span>
          )}
        </DateLabel>
      )}

      {/* Event content */}
      {eventType === 'case_created' && renderCaseCreated()}
      {eventType === 'diagnostics_attached' && renderDiagnosticsAttached()}
      {eventType === 'status_change' && renderStatusChange()}
      {eventType === 'reply' && renderReply()}
    </TimelineEntry>
  );
};

export default SupportTimelineBlock;

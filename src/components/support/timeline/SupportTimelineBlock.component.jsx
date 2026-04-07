import React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { SUPPORT_THEME } from '../defaults/support.defaults';

const TimelineEntry = styled('div')({
  position: 'relative',
  paddingLeft: '40px',
  paddingBottom: '24px',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '15px',
    top: '36px',
    bottom: 0,
    width: '1px',
    backgroundColor: SUPPORT_THEME.border,
  },
  '&:last-child::before': {
    display: 'none',
  },
});

const TimelineAvatar = styled('div')({
  position: 'absolute',
  left: 0,
  top: 0,
});

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(timestamp);
  }
};

const SupportTimelineBlock = ({ message, ...props }) => {
  if (!message) return null;

  const isSystem = message.author_type === 'system' || message.author_type === 'bot';
  const authorName = message.author_name || (isSystem ? 'System' : 'User');
  const avatarBg = isSystem ? SUPPORT_THEME.info : SUPPORT_THEME.brandPrimary;

  return (
    <TimelineEntry {...props}>
      <TimelineAvatar>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '14px',
            backgroundColor: avatarBg,
          }}
        >
          {isSystem ? (
            <SmartToyIcon sx={{ fontSize: 16 }} />
          ) : (
            <PersonIcon sx={{ fontSize: 16 }} />
          )}
        </Avatar>
      </TimelineAvatar>

      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            className="fw-semibold"
            style={{ fontSize: '13px', color: SUPPORT_THEME.textPrimary }}
          >
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
                backgroundColor: SUPPORT_THEME.surfaceSecondary,
                color: SUPPORT_THEME.textSecondary,
              }}
            />
          )}
          <span style={{ fontSize: '12px', color: SUPPORT_THEME.textMuted }}>
            {formatTimestamp(message.created_at || message.timestamp)}
          </span>
        </div>

        <div
          className="p-3 rounded-3"
          style={{
            backgroundColor: isSystem ? SUPPORT_THEME.surfaceLight : '#ffffff',
            border: `1px solid ${SUPPORT_THEME.border}`,
            fontSize: '13px',
            lineHeight: 1.6,
            color: SUPPORT_THEME.textPrimary,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.body || message.content}
        </div>

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
                  borderColor: SUPPORT_THEME.border,
                  color: SUPPORT_THEME.textSecondary,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </TimelineEntry>
  );
};

export default SupportTimelineBlock;

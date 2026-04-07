import React, { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { SUPPORT_THEME } from '../defaults/support.defaults';

const SupportResponseComposer = ({ onSubmit, isSubmitting, ...props }) => {
  const [responseText, setResponseText] = useState('');

  const handleSubmit = () => {
    if (!responseText.trim() || !onSubmit) return;
    onSubmit({ body: responseText.trim() });
    setResponseText('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="border rounded-3 p-3"
      style={{ borderColor: SUPPORT_THEME.border }}
      {...props}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span
          className="fw-semibold"
          style={{ fontSize: '13px', color: SUPPORT_THEME.textPrimary }}
        >
          Add a response
        </span>
      </div>

      <textarea
        className="form-control border-0 p-0 mb-2"
        rows={4}
        placeholder="Type your response..."
        value={responseText}
        onChange={(event) => setResponseText(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        style={{
          resize: 'none',
          fontSize: '13px',
          color: SUPPORT_THEME.textPrimary,
          backgroundColor: 'transparent',
          outline: 'none',
          boxShadow: 'none',
        }}
      />

      <div
        className="d-flex align-items-center justify-content-between pt-2"
        style={{ borderTop: `1px solid ${SUPPORT_THEME.border}` }}
      >
        <IconButton
          size="small"
          sx={{ color: SUPPORT_THEME.textMuted }}
          title="Attach Diagnostics"
        >
          <AttachFileIcon fontSize="small" />
        </IconButton>

        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={!responseText.trim() || isSubmitting}
          endIcon={<SendIcon sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: SUPPORT_THEME.brandPrimary,
            '&:hover': { backgroundColor: '#334155' },
            '&:disabled': { backgroundColor: SUPPORT_THEME.border },
          }}
        >
          Post Response
        </Button>
      </div>
    </div>
  );
};

export default SupportResponseComposer;

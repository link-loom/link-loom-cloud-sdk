import React, { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import { TextEditor } from '@link-loom/react-sdk';
import { SUPPORT_THEME } from '../defaults/support.defaults';

const SupportResponseComposer = ({
  onSubmit,
  isSubmitting,
  theme = SUPPORT_THEME,
  config = {},
  ...props
}) => {
  const [editorKey, setEditorKey] = useState(0);
  const [markdownContent, setMarkdownContent] = useState('');
  const [plainText, setPlainText] = useState('');

  const handleModelChange = useCallback(({ model, modelText }) => {
    setMarkdownContent(model ? decodeURIComponent(model) : '');
    setPlainText(modelText || '');
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = plainText.trim();
    if (!trimmed || !onSubmit) return;
    onSubmit({ body: markdownContent.trim() });
    setMarkdownContent('');
    setPlainText('');
    setEditorKey((prev) => prev + 1);
  }, [plainText, markdownContent, onSubmit]);

  const title = config.responseTitle || 'Add a response';
  const isEmpty = !plainText.trim();

  return (
    <div
      className="border rounded-3 overflow-hidden"
      style={{ borderColor: theme.border }}
      {...props}
    >
      <TextEditor
        key={editorKey}
        id="support-response-editor"
        modelraw={encodeURIComponent('')}
        onModelChange={handleModelChange}
        outputFormat="markdown"
        autoGrow={true}
        minRows={3}
        maxRows={8}
        toolbarOptions={['bold', 'italic', 'code']}
        ui={{
          toolbar: {
            layout: 'inline',
            title,
            titleColor: theme.textPrimary,
            className: 'bg-body',
            borderBottom: `1px solid ${theme.border}`,
          },
        }}
      />

      <div
        className="d-flex align-items-center justify-content-end px-3 py-2"
        style={{ borderTop: `1px solid ${theme.border}` }}
      >
        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: theme.primary,
            color: theme.onPrimary,
            boxShadow: 'none',
            '&:hover': { backgroundColor: theme.primaryDim, boxShadow: 'none' },
            '&:disabled': { backgroundColor: theme.border },
          }}
        >
          Post response
        </Button>
      </div>
    </div>
  );
};

export default SupportResponseComposer;

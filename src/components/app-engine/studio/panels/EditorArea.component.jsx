import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Editor from '@monaco-editor/react';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const EditorArea = ({
  openFiles = [],
  activeFilePath,
  onTabChange,
  onTabClose,
  onContentChange,
  editorTheme,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;
  const editorOptions = ui.editorOptions || STUDIO_UI_DEFAULTS.editorOptions;

  const activeFile = openFiles.find((f) => f.path === activeFilePath);
  const activeIndex = openFiles.findIndex((f) => f.path === activeFilePath);

  const handleTabChange = (event, newIndex) => {
    if (onTabChange && openFiles[newIndex]) {
      onTabChange(openFiles[newIndex].path);
    }
  };

  const handleTabClose = (event, filePath) => {
    event.stopPropagation();
    if (onTabClose) {
      onTabClose(filePath);
    }
  };

  const handleEditorChange = useCallback(
    (value) => {
      if (onContentChange && activeFilePath) {
        onContentChange(activeFilePath, value);
      }
    },
    [onContentChange, activeFilePath]
  );

  const getLanguage = (filePath) => {
    if (!filePath) return 'javascript';
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) return 'javascript';
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) return 'javascript';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: theme.background, overflow: 'hidden' }}>
      {openFiles.length > 0 ? (
        <>
          <div style={{ backgroundColor: theme.tabsBackground, borderBottom: `1px solid ${theme.border}`, minHeight: '35px' }}>
            <Tabs
              value={activeIndex >= 0 ? activeIndex : 0}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: '35px',
                '& .MuiTabs-indicator': { backgroundColor: theme.brandPrimary, height: '2px' },
                '& .MuiTabs-scrollButtons': { color: theme.textMuted },
              }}
            >
              {openFiles.map((file) => (
                <Tab
                  key={file.path}
                  sx={{
                    minHeight: '35px',
                    padding: '0 12px',
                    textTransform: 'none',
                    fontSize: '12px',
                    color: theme.textSecondary,
                    '&.Mui-selected': { color: theme.textPrimary, backgroundColor: theme.background },
                  }}
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {file.isDirty && (
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.textPrimary }} />
                      )}
                      {file.name || file.path.split('/').pop()}
                      <IconButton
                        size="small"
                        onClick={(e) => handleTabClose(e, file.path)}
                        sx={{ color: theme.textMuted, padding: '1px', ml: '4px', '&:hover': { color: theme.textPrimary } }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </span>
                  }
                />
              ))}
            </Tabs>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeFile && (
              <Editor
                height="100%"
                language={getLanguage(activeFile.path)}
                value={activeFile.content || ''}
                onChange={handleEditorChange}
                theme={editorTheme || editorOptions.theme || 'vs-dark'}
                options={{
                  minimap: editorOptions.minimap,
                  fontSize: editorOptions.fontSize,
                  lineNumbers: editorOptions.lineNumbers,
                  scrollBeyondLastLine: editorOptions.scrollBeyondLastLine,
                  wordWrap: editorOptions.wordWrap,
                  tabSize: editorOptions.tabSize,
                  automaticLayout: editorOptions.automaticLayout !== false,
                  padding: editorOptions.padding || { top: 8 },
                }}
              />
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '14px', mb: 1 }}>{ui.noFileOpen || STUDIO_UI_DEFAULTS.noFileOpen}</Typography>
            <Typography sx={{ fontSize: '12px' }}>{ui.noFileHint || STUDIO_UI_DEFAULTS.noFileHint}</Typography>
          </Box>
        </div>
      )}
    </div>
  );
};

export default EditorArea;

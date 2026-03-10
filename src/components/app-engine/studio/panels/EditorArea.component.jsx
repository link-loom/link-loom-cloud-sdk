import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Editor from '@monaco-editor/react';

const EditorContainer = styled('div')({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#1E1E1E',
  overflow: 'hidden',
});

const TabsContainer = styled('div')({
  backgroundColor: '#252526',
  borderBottom: '1px solid #6B728040',
  minHeight: '35px',
});

const EditorWrapper = styled('div')({
  flex: 1,
  overflow: 'hidden',
});

const EmptyEditor = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#6B7280',
});

const StyledTab = styled(Tab)(({ $isDirty }) => ({
  minHeight: '35px',
  padding: '0 12px',
  textTransform: 'none',
  fontSize: '12px',
  color: '#9CA3AF',
  '&.Mui-selected': {
    color: '#EAEAF0',
    backgroundColor: '#1E1E1E',
  },
  '& .tab-label': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  '& .dirty-indicator': {
    display: $isDirty ? 'inline-block' : 'none',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#EAEAF0',
  },
}));

const EditorArea = ({
  openFiles = [],
  activeFilePath,
  onTabChange,
  onTabClose,
  onContentChange,
}) => {
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
    <EditorContainer>
      {openFiles.length > 0 ? (
        <>
          <TabsContainer>
            <Tabs
              value={activeIndex >= 0 ? activeIndex : 0}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: '35px',
                '& .MuiTabs-indicator': { backgroundColor: '#7C3AED', height: '2px' },
                '& .MuiTabs-scrollButtons': { color: '#6B7280' },
              }}
            >
              {openFiles.map((file) => (
                <StyledTab
                  key={file.path}
                  $isDirty={file.isDirty}
                  label={
                    <span className="tab-label">
                      <span className="dirty-indicator" />
                      {file.name || file.path.split('/').pop()}
                      <IconButton
                        size="small"
                        onClick={(e) => handleTabClose(e, file.path)}
                        sx={{ color: '#6B7280', padding: '1px', ml: '4px', '&:hover': { color: '#EAEAF0' } }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </span>
                  }
                />
              ))}
            </Tabs>
          </TabsContainer>
          <EditorWrapper>
            {activeFile && (
              <Editor
                height="100%"
                language={getLanguage(activeFile.path)}
                value={activeFile.content || ''}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 8 },
                }}
              />
            )}
          </EditorWrapper>
        </>
      ) : (
        <EmptyEditor>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '14px', mb: 1 }}>No file open</Typography>
            <Typography sx={{ fontSize: '12px' }}>Select a file from the explorer to start editing</Typography>
          </Box>
        </EmptyEditor>
      )}
    </EditorContainer>
  );
};

export default EditorArea;

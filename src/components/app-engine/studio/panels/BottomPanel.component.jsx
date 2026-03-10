import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const PanelContainer = styled('div')(({ $isOpen, $height }) => ({
  height: $isOpen ? `${$height}px` : '35px',
  backgroundColor: '#1F1E26',
  borderTop: '1px solid #6B728040',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'height 0.2s',
}));

const PanelHeader = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '35px',
  borderBottom: '1px solid #6B728040',
});

const PanelContent = styled('div')({
  flex: 1,
  overflowY: 'auto',
  padding: '8px 12px',
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: '12px',
  lineHeight: 1.6,
});

const LogLine = styled('div')(({ $level }) => ({
  color: $level === 'error' ? '#EF4444' : $level === 'warning' ? '#F59E0B' : $level === 'success' ? '#10B981' : '#9CA3AF',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
}));

const BottomPanel = ({
  buildLog = '',
  buildErrors = [],
  isOpen: controlledIsOpen,
  onToggle,
  height = 200,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isOpen);
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const logLines = buildLog ? buildLog.split('\n').filter(Boolean) : [];

  return (
    <PanelContainer $isOpen={isOpen} $height={height}>
      <PanelHeader>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            minHeight: '35px',
            '& .MuiTab-root': { minHeight: '35px', fontSize: '11px', textTransform: 'none', color: '#9CA3AF', padding: '0 16px' },
            '& .Mui-selected': { color: '#EAEAF0' },
            '& .MuiTabs-indicator': { backgroundColor: '#7C3AED' },
          }}
        >
          <Tab label={`Build Output${logLines.length ? ` (${logLines.length})` : ''}`} />
          <Tab label={`Problems${buildErrors.length ? ` (${buildErrors.length})` : ''}`} />
        </Tabs>
        <IconButton size="small" onClick={handleToggle} sx={{ color: '#6B7280', mr: 1 }}>
          {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
        </IconButton>
      </PanelHeader>

      <PanelContent>
        {activeTab === 0 && (
          <>
            {logLines.length > 0 ? (
              logLines.map((line, index) => {
                let level = 'info';
                if (line.toLowerCase().includes('error')) level = 'error';
                else if (line.toLowerCase().includes('warn')) level = 'warning';
                else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('built')) level = 'success';

                return <LogLine key={index} $level={level}>{line}</LogLine>;
              })
            ) : (
              <LogLine $level="info">No build output yet. Click &quot;Build&quot; to compile the app.</LogLine>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            {buildErrors.length > 0 ? (
              buildErrors.map((error, index) => (
                <LogLine key={index} $level="error">{error}</LogLine>
              ))
            ) : (
              <LogLine $level="success">No problems detected.</LogLine>
            )}
          </>
        )}
      </PanelContent>
    </PanelContainer>
  );
};

export default BottomPanel;

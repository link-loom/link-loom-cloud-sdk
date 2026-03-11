import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const BottomPanel = ({
  buildLog = '',
  buildErrors = [],
  isOpen: controlledIsOpen,
  onToggle,
  height,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;
  const panelHeight = height || theme.bottomPanelHeight || STUDIO_UI_DEFAULTS.theme.bottomPanelHeight;

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

  const getLineColor = (line) => {
    if (line.toLowerCase().includes('error')) return theme.error;
    if (line.toLowerCase().includes('warn')) return theme.warning;
    if (line.toLowerCase().includes('success') || line.toLowerCase().includes('built')) return theme.success;
    return theme.textSecondary;
  };

  return (
    <div
      style={{
        height: isOpen ? `${panelHeight}px` : '35px',
        backgroundColor: theme.panelBackground,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'height 0.2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '35px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            minHeight: '35px',
            '& .MuiTab-root': { minHeight: '35px', fontSize: '11px', textTransform: 'none', color: theme.textSecondary, padding: '0 16px' },
            '& .Mui-selected': { color: theme.textPrimary },
            '& .MuiTabs-indicator': { backgroundColor: theme.brandPrimary },
          }}
        >
          <Tab label={`${ui.tabBuildOutput || STUDIO_UI_DEFAULTS.tabBuildOutput}${logLines.length ? ` (${logLines.length})` : ''}`} />
          <Tab label={`${ui.tabProblems || STUDIO_UI_DEFAULTS.tabProblems}${buildErrors.length ? ` (${buildErrors.length})` : ''}`} />
        </Tabs>
        <IconButton size="small" onClick={handleToggle} sx={{ color: theme.textMuted, mr: 1 }}>
          {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
        </IconButton>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '12px',
          lineHeight: 1.6,
        }}
      >
        {activeTab === 0 && (
          <>
            {logLines.length > 0 ? (
              logLines.map((line, index) => (
                <div key={index} style={{ color: getLineColor(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</div>
              ))
            ) : (
              <div style={{ color: theme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {ui.noBuildOutput || STUDIO_UI_DEFAULTS.noBuildOutput}
              </div>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            {buildErrors.length > 0 ? (
              buildErrors.map((error, index) => (
                <div key={index} style={{ color: theme.error, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{error}</div>
              ))
            ) : (
              <div style={{ color: theme.success, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {ui.noProblems || STUDIO_UI_DEFAULTS.noProblems}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;

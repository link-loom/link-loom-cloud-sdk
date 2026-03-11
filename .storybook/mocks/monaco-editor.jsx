import React from 'react';

const Editor = ({ value, language, height, onChange, theme, options }) => {
  return (
    <div
      style={{
        height: height || '100%',
        backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
        color: theme === 'vs-dark' ? '#d4d4d4' : '#1e1e1e',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: options?.fontSize || 13,
        padding: '8px 12px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        border: '1px solid #333',
      }}
    >
      <textarea
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          border: 'none',
          outline: 'none',
          resize: 'none',
        }}
      />
    </div>
  );
};

export default Editor;
export { Editor };

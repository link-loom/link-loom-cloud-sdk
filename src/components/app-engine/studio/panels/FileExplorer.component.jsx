import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { STUDIO_UI_DEFAULTS } from '../../defaults/appEngine.defaults';

const FileExplorer = ({
  fileTree = [],
  activeFilePath,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  ui = STUDIO_UI_DEFAULTS,
}) => {
  const theme = ui.theme || STUDIO_UI_DEFAULTS.theme;
  const fileColors = theme.fileColors || STUDIO_UI_DEFAULTS.theme.fileColors;

  const [expandedFolders, setExpandedFolders] = useState(new Set(['/src', '/src/components', '/src/views']));

  const tree = useMemo(() => {
    return buildTree(fileTree);
  }, [fileTree]);

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleItemClick = (item) => {
    if (item.kind === 'folder') {
      toggleFolder(item.path);
    } else if (onFileSelect) {
      onFileSelect(item);
    }
  };

  const getFileColor = (language) => {
    return fileColors[language] || fileColors.default || theme.textMuted;
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.kind === 'folder';
      const isExpanded = expandedFolders.has(node.path);
      const isActive = node.path === activeFilePath;

      return (
        <React.Fragment key={node.path}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: `3px 8px 3px ${8 + depth * 16}px`,
              cursor: 'pointer',
              fontSize: '12px',
              color: isActive ? theme.textPrimary : theme.textSecondary,
              backgroundColor: isActive ? theme.brandPrimaryHighlight : 'transparent',
            }}
            onClick={() => handleItemClick(node)}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = theme.inputBackground;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isFolder ? (
              isExpanded ? <ExpandMoreIcon sx={{ fontSize: 14, color: theme.textMuted }} /> : <ChevronRightIcon sx={{ fontSize: 14, color: theme.textMuted }} />
            ) : (
              <span style={{ width: 14 }} />
            )}
            {isFolder ? (
              isExpanded ? <FolderOpenIcon sx={{ fontSize: 14, color: fileColors.folder }} /> : <FolderIcon sx={{ fontSize: 14, color: fileColors.folder }} />
            ) : (
              <InsertDriveFileIcon sx={{ fontSize: 14, color: getFileColor(node.language) }} />
            )}
            <Typography sx={{ fontSize: '12px', color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.name}
            </Typography>
          </div>
          {isFolder && isExpanded && node.children?.length > 0 && renderTree(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: theme.panelBackground,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.border}`,
          minHeight: '36px',
        }}
      >
        <Typography sx={{ color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {ui.explorerTitle || STUDIO_UI_DEFAULTS.explorerTitle}
        </Typography>
        <Box sx={{ display: 'flex', gap: '2px' }}>
          {onCreateFile && (
            <IconButton size="small" onClick={onCreateFile} sx={{ color: theme.textMuted, padding: '2px' }}>
              <NoteAddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {onCreateFolder && (
            <IconButton size="small" onClick={onCreateFolder} sx={{ color: theme.textMuted, padding: '2px' }}>
              <CreateNewFolderIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {renderTree(tree)}
      </div>
    </div>
  );
};

function buildTree(files) {
  const root = [];
  const folderMap = {};

  const folders = files.filter((f) => f.kind === 'folder').sort((a, b) => a.path.localeCompare(b.path));
  const fileItems = files.filter((f) => f.kind !== 'folder').sort((a, b) => a.path.localeCompare(b.path));

  for (const folder of folders) {
    folderMap[folder.path] = { ...folder, children: [] };
  }

  for (const file of fileItems) {
    const parentPath = file.parent_path || '/';
    if (folderMap[parentPath]) {
      folderMap[parentPath].children.push(file);
    }
  }

  for (const folder of folders) {
    const parentPath = folder.parent_path || null;
    if (parentPath && folderMap[parentPath]) {
      folderMap[parentPath].children.unshift(folderMap[folder.path]);
    } else {
      root.push(folderMap[folder.path]);
    }
  }

  const orphanFiles = fileItems.filter((f) => !f.parent_path || f.parent_path === '/');
  root.push(...orphanFiles);

  return root;
}

export default FileExplorer;

import React, { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
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

const PanelContainer = styled('div')({
  height: '100%',
  backgroundColor: '#1F1E26',
  borderRight: '1px solid #6B728040',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const PanelHeader = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #6B728040',
  minHeight: '36px',
});

const TreeContainer = styled('div')({
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
});

const TreeItem = styled('div')(({ $depth, $isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: `3px 8px 3px ${8 + $depth * 16}px`,
  cursor: 'pointer',
  fontSize: '12px',
  color: $isActive ? '#EAEAF0' : '#9CA3AF',
  backgroundColor: $isActive ? '#7C3AED20' : 'transparent',
  '&:hover': {
    backgroundColor: $isActive ? '#7C3AED20' : '#2B2A33',
  },
}));

const FileExplorer = ({
  fileTree = [],
  activeFilePath,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
}) => {
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

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.kind === 'folder';
      const isExpanded = expandedFolders.has(node.path);
      const isActive = node.path === activeFilePath;

      return (
        <React.Fragment key={node.path}>
          <TreeItem $depth={depth} $isActive={isActive} onClick={() => handleItemClick(node)}>
            {isFolder ? (
              isExpanded ? <ExpandMoreIcon sx={{ fontSize: 14, color: '#6B7280' }} /> : <ChevronRightIcon sx={{ fontSize: 14, color: '#6B7280' }} />
            ) : (
              <span style={{ width: 14 }} />
            )}
            {isFolder ? (
              isExpanded ? <FolderOpenIcon sx={{ fontSize: 14, color: '#F59E0B' }} /> : <FolderIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
            ) : (
              <InsertDriveFileIcon sx={{ fontSize: 14, color: getFileColor(node.language) }} />
            )}
            <Typography sx={{ fontSize: '12px', color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.name}
            </Typography>
          </TreeItem>
          {isFolder && isExpanded && node.children?.length > 0 && renderTree(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <Typography sx={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Explorer
        </Typography>
        <Box sx={{ display: 'flex', gap: '2px' }}>
          {onCreateFile && (
            <IconButton size="small" onClick={onCreateFile} sx={{ color: '#6B7280', padding: '2px' }}>
              <NoteAddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {onCreateFolder && (
            <IconButton size="small" onClick={onCreateFolder} sx={{ color: '#6B7280', padding: '2px' }}>
              <CreateNewFolderIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </PanelHeader>
      <TreeContainer>
        {renderTree(tree)}
      </TreeContainer>
    </PanelContainer>
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

function getFileColor(language) {
  const colors = {
    jsx: '#61DAFB',
    js: '#F7DF1E',
    css: '#264DE4',
    json: '#6B7280',
    html: '#E34F26',
  };
  return colors[language] || '#6B7280';
}

export default FileExplorer;

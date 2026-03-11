import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import { updateEntityRecord } from '../../../services/utils/entityServiceAdapter';
import StudioToolbar from './panels/StudioToolbar.component';
import FileExplorer from './panels/FileExplorer.component';
import EditorArea from './panels/EditorArea.component';
import PropertiesPanel from './panels/PropertiesPanel.component';
import BottomPanel from './panels/BottomPanel.component';
import { STUDIO_UI_DEFAULTS, mergeDefaults } from '../defaults/appEngine.defaults';

const AppStudio = ({
  appDefinitionId,
  appDefinitionService,
  appFileService,
  appVersionService,
  appBuildService,
  ui = STUDIO_UI_DEFAULTS,
  onBack,
  onRun,
  onNavigateToRuntime,
  className = '',
}) => {
  const config = mergeDefaults(STUDIO_UI_DEFAULTS, ui);
  const theme = config.theme || STUDIO_UI_DEFAULTS.theme;

  const [appDefinition, setAppDefinition] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildStatus, setBuildStatus] = useState(null);
  const [buildLog, setBuildLog] = useState('');
  const [buildErrors, setBuildErrors] = useState([]);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isDirty = openFiles.some((f) => f.isDirty);
  const definitionDirtyRef = useRef(false);

  const loadStudioPayload = useCallback(async () => {
    if (!appDefinitionService || !appDefinitionId) return;

    try {
      const response = await appDefinitionService.getStudioPayload({ id: appDefinitionId });

      if (response?.result) {
        setAppDefinition(response.result.definition);
        setFileTree(response.result.file_tree || []);
      }
    } catch (error) {
      console.error('Failed to load studio payload:', error);
    }
  }, [appDefinitionService, appDefinitionId]);

  useEffect(() => {
    loadStudioPayload();
  }, [loadStudioPayload]);

  const handleFileSelect = useCallback(async (file) => {
    if (file.kind === 'folder') return;

    const existing = openFiles.find((f) => f.path === file.path);

    if (existing) {
      setActiveFilePath(file.path);
      return;
    }

    let content = file.content;

    if (content === undefined || content === null) {
      try {
        const response = await appFileService.getFileContent({ search: file.id });
        if (response?.result) {
          content = response.result.content || '';
        }
      } catch (error) {
        console.error('Failed to load file content:', error);
        content = '';
      }
    }

    setOpenFiles((prev) => [...prev, { ...file, content, isDirty: false, originalContent: content }]);
    setActiveFilePath(file.path);
  }, [openFiles, appFileService]);

  const handleContentChange = useCallback((filePath, newContent) => {
    setOpenFiles((prev) =>
      prev.map((f) => {
        if (f.path !== filePath) return f;
        return { ...f, content: newContent, isDirty: newContent !== f.originalContent };
      })
    );
  }, []);

  const handleTabChange = useCallback((filePath) => {
    setActiveFilePath(filePath);
  }, []);

  const handleTabClose = useCallback((filePath) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.path !== filePath);

      if (filePath === activeFilePath) {
        const closedIndex = prev.findIndex((f) => f.path === filePath);
        const newActive = next[Math.min(closedIndex, next.length - 1)]?.path || null;
        setActiveFilePath(newActive);
      }

      return next;
    });
  }, [activeFilePath]);

  const handleSave = useCallback(async () => {
    if (!appFileService) return;

    setIsSaving(true);

    try {
      const dirtyFiles = openFiles.filter((f) => f.isDirty);
      const changes = dirtyFiles.map((f) => ({
        operation: 'update',
        id: f.id,
        path: f.path,
        content: f.content,
      }));

      if (changes.length > 0) {
        await appFileService.applyChanges({
          app_definition_id: appDefinitionId,
          changes,
        });

        setOpenFiles((prev) =>
          prev.map((f) => (f.isDirty ? { ...f, isDirty: false, originalContent: f.content } : f))
        );
      }

      if (definitionDirtyRef.current && appDefinitionService) {
        await updateEntityRecord({ service: appDefinitionService, payload: appDefinition });
        definitionDirtyRef.current = false;
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [openFiles, appFileService, appDefinitionId, appDefinitionService, appDefinition]);

  const handleBuild = useCallback(async () => {
    if (!appBuildService) return;

    setBuildStatus('building');
    setBuildLog('');
    setBuildErrors([]);
    setIsBottomPanelOpen(true);

    try {
      const response = await appBuildService.buildSingle({
        app_definition_id: appDefinitionId,
        organization_id: appDefinition?.organization_id,
      });

      if (response?.result) {
        setBuildStatus(response.result.build_status || 'success');
        setBuildLog(response.result.build_log || 'Build completed successfully');
      } else {
        setBuildStatus('failed');
        setBuildErrors([response?.message || 'Build failed']);
      }
    } catch (error) {
      setBuildStatus('failed');
      setBuildErrors([error.message || 'Build failed']);
    }
  }, [appBuildService, appDefinitionId, appDefinition]);

  const handlePublish = useCallback(async () => {
    if (!appVersionService) return;

    setIsPublishing(true);

    try {
      const response = await appVersionService.publish({
        app_definition_id: appDefinitionId,
      });

      if (response?.result) {
        setBuildLog((prev) => prev + '\nVersion published successfully: ' + (response.result.version || ''));
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setIsPublishing(false);
    }
  }, [appVersionService, appDefinitionId]);

  const handleUpdateDefinition = useCallback((updated) => {
    setAppDefinition(updated);
    definitionDirtyRef.current = true;
  }, []);

  const handlePreview = useCallback(async () => {
    if (!onNavigateToRuntime) return;
    setIsPreviewing(true);
    try {
      await onNavigateToRuntime(appDefinition);
    } catch (error) {
      console.error('Failed to navigate to runtime:', error);
    } finally {
      setIsPreviewing(false);
    }
  }, [onNavigateToRuntime, appDefinition]);

  const handleRunApp = useCallback(() => {
    if (onRun) onRun(appDefinition);
  }, [onRun, appDefinition]);

  const fileExplorerWidth = theme.fileExplorerWidth || STUDIO_UI_DEFAULTS.theme.fileExplorerWidth;

  return (
    <div
      className={className || undefined}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background,
        overflow: 'hidden',
      }}
    >
      <StudioToolbar
        appName={appDefinition?.name}
        isSaving={isSaving}
        isDirty={isDirty || definitionDirtyRef.current}
        buildStatus={buildStatus}
        isPublishing={isPublishing}
        isPreviewing={isPreviewing}
        onBack={onBack}
        onSave={handleSave}
        onBuild={handleBuild}
        onPublish={handlePublish}
        onPreview={handlePreview}
        onRun={handleRunApp}
        onToggleProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
        isPropertiesOpen={isPropertiesOpen}
        ui={config}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: `${fileExplorerWidth}px`, minWidth: `${fileExplorerWidth}px`, height: '100%' }}>
          <FileExplorer
            fileTree={fileTree}
            activeFilePath={activeFilePath}
            onFileSelect={handleFileSelect}
            ui={config}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <EditorArea
              openFiles={openFiles}
              activeFilePath={activeFilePath}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onContentChange={handleContentChange}
              ui={config}
            />
          </Box>
          <BottomPanel
            buildLog={buildLog}
            buildErrors={buildErrors}
            isOpen={isBottomPanelOpen}
            onToggle={setIsBottomPanelOpen}
            ui={config}
          />
        </div>

        <PropertiesPanel
          isOpen={isPropertiesOpen}
          onClose={() => setIsPropertiesOpen(false)}
          appDefinition={appDefinition}
          onUpdateDefinition={handleUpdateDefinition}
          ui={config}
        />
      </div>
    </div>
  );
};

export default AppStudio;

import { useState, useCallback, useRef } from 'react';

export default function useAppStudio({ appDefinitionService, appFileService, appVersionService, appBuildService }) {
  const [appDefinition, setAppDefinition] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildStatus, setBuildStatus] = useState(null);
  const [buildLog, setBuildLog] = useState('');
  const [buildErrors, setBuildErrors] = useState([]);

  const definitionDirtyRef = useRef(false);

  const isDirty = openFiles.some((f) => f.isDirty) || definitionDirtyRef.current;

  const loadStudioPayload = useCallback(async (appDefinitionId) => {
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
  }, [appDefinitionService]);

  const openFile = useCallback(async (file) => {
    if (file.kind === 'folder') return;

    const existing = openFiles.find((f) => f.path === file.path);
    if (existing) {
      setActiveFilePath(file.path);
      return;
    }

    let content = file.content;
    if (content === undefined || content === null) {
      try {
        const response = await appFileService?.getFileContent({ search: file.id });
        content = response?.result?.content || '';
      } catch (error) {
        console.error('Failed to load file content:', error);
        content = '';
      }
    }

    setOpenFiles((prev) => [...prev, { ...file, content, isDirty: false, originalContent: content }]);
    setActiveFilePath(file.path);
  }, [openFiles, appFileService]);

  const updateFileContent = useCallback((filePath, newContent) => {
    setOpenFiles((prev) =>
      prev.map((f) => {
        if (f.path !== filePath) return f;
        return { ...f, content: newContent, isDirty: newContent !== f.originalContent };
      })
    );
  }, []);

  const closeFile = useCallback((filePath) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.path !== filePath);
      if (filePath === activeFilePath) {
        const closedIndex = prev.findIndex((f) => f.path === filePath);
        setActiveFilePath(next[Math.min(closedIndex, next.length - 1)]?.path || null);
      }
      return next;
    });
  }, [activeFilePath]);

  const save = useCallback(async (appDefinitionId) => {
    if (!appFileService) return;
    setIsSaving(true);

    try {
      const dirtyFiles = openFiles.filter((f) => f.isDirty);
      if (dirtyFiles.length > 0) {
        await appFileService.applyChanges({
          app_definition_id: appDefinitionId,
          changes: dirtyFiles.map((f) => ({ operation: 'update', id: f.id, path: f.path, content: f.content })),
        });
        setOpenFiles((prev) => prev.map((f) => (f.isDirty ? { ...f, isDirty: false, originalContent: f.content } : f)));
      }

      if (definitionDirtyRef.current && appDefinitionService) {
        await appDefinitionService.update(appDefinition);
        definitionDirtyRef.current = false;
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [openFiles, appFileService, appDefinitionService, appDefinition]);

  const build = useCallback(async (appDefinitionId) => {
    if (!appBuildService) return;
    setBuildStatus('building');
    setBuildLog('');
    setBuildErrors([]);

    try {
      const response = await appBuildService.build({
        app_definition_id: appDefinitionId,
        organization_id: appDefinition?.organization_id,
      });
      setBuildStatus(response?.result ? 'success' : 'failed');
      setBuildLog(response?.result?.build_log || '');
    } catch (error) {
      setBuildStatus('failed');
      setBuildErrors([error.message]);
    }
  }, [appBuildService, appDefinition]);

  const publish = useCallback(async (appDefinitionId) => {
    if (!appVersionService) return;
    try {
      await appVersionService.publish({ app_definition_id: appDefinitionId });
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  }, [appVersionService]);

  const updateDefinition = useCallback((updated) => {
    setAppDefinition(updated);
    definitionDirtyRef.current = true;
  }, []);

  return {
    appDefinition,
    fileTree,
    openFiles,
    activeFilePath,
    isSaving,
    isDirty,
    buildStatus,
    buildLog,
    buildErrors,
    setActiveFilePath,
    loadStudioPayload,
    openFile,
    updateFileContent,
    closeFile,
    save,
    build,
    publish,
    updateDefinition,
  };
}

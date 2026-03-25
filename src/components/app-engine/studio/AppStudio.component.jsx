import React, { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { updateEntityRecord } from "../../../services/utils/entityServiceAdapter";
import StudioToolbar from "./panels/StudioToolbar.component";
import ActivityBar from "./panels/ActivityBar.component";
import FileExplorer from "./panels/FileExplorer.component";
import EditorArea from "./panels/EditorArea.component";
import PropertiesPanel from "./panels/PropertiesPanel.component";
import RunPanel from "./panels/RunPanel.component";
import BottomPanel from "./panels/BottomPanel.component";
import AppRuntimeHost from "../runtime/AppRuntimeHost.component";
import {
  STUDIO_UI_DEFAULTS,
  mergeDefaults,
} from "../defaults/appEngine.defaults";

const AppStudio = ({
  appDefinitionId,
  appDefinitionService,
  appFileService,
  appVersionService,
  appBuildService,
  appSessionService,
  ui = STUDIO_UI_DEFAULTS,
  onBack,
  onRun,
  onNavigateToRuntime,
  className = "",
}) => {
  const config = mergeDefaults(STUDIO_UI_DEFAULTS, ui);
  const darkTheme = config.theme || STUDIO_UI_DEFAULTS.theme;
  const lightTheme = config.lightTheme || STUDIO_UI_DEFAULTS.lightTheme;

  const [appDefinition, setAppDefinition] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildStatus, setBuildStatus] = useState(null);
  const [buildLog, setBuildLog] = useState("");
  const [buildErrors, setBuildErrors] = useState([]);
  const [activePanel, setActivePanel] = useState('explorer');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const theme = editorTheme === "vs-dark" ? darkTheme : lightTheme;
  const [hasBuild, setHasBuild] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isDirty = openFiles.some((f) => f.isDirty);
  const definitionDirtyRef = useRef(false);

  const loadStudioPayload = useCallback(async () => {
    if (!appDefinitionService || !appDefinitionId) return;

    try {
      const response = await appDefinitionService.getStudioPayload({
        id: appDefinitionId,
      });

      if (response?.result) {
        setAppDefinition(response.result.definition);
        setFileTree(response.result.file_tree || []);

        if (response.result.latest_version) {
          setLatestVersion(response.result.latest_version);
          setHasBuild(true);
          setIsPublished(true);
        }
      }
    } catch (error) {
      console.error("Failed to load studio payload:", error);
    }
  }, [appDefinitionService, appDefinitionId]);

  useEffect(() => {
    loadStudioPayload();
  }, [loadStudioPayload]);

  const handleFileSelect = useCallback(
    async (file) => {
      if (file.kind === "folder") return;

      const existing = openFiles.find((f) => f.path === file.path);

      if (existing) {
        setActiveFilePath(file.path);
        return;
      }

      let content = file.content;

      if (content === undefined || content === null) {
        try {
          const response = await appFileService.getFileContent({
            search: file.id,
          });
          if (response?.result) {
            content = response.result.content || "";
          }
        } catch (error) {
          console.error("Failed to load file content:", error);
          content = "";
        }
      }

      setOpenFiles((prev) => [
        ...prev,
        { ...file, content, isDirty: false, originalContent: content },
      ]);
      setActiveFilePath(file.path);
    },
    [openFiles, appFileService],
  );

  const handleContentChange = useCallback((filePath, newContent) => {
    setOpenFiles((prev) =>
      prev.map((f) => {
        if (f.path !== filePath) return f;
        return {
          ...f,
          content: newContent,
          isDirty: newContent !== f.originalContent,
        };
      }),
    );
  }, []);

  const handleTabChange = useCallback((filePath) => {
    setActiveFilePath(filePath);
  }, []);

  const handleTabClose = useCallback(
    (filePath) => {
      setOpenFiles((prev) => {
        const next = prev.filter((f) => f.path !== filePath);

        if (filePath === activeFilePath) {
          const closedIndex = prev.findIndex((f) => f.path === filePath);
          const newActive =
            next[Math.min(closedIndex, next.length - 1)]?.path || null;
          setActiveFilePath(newActive);
        }

        return next;
      });
    },
    [activeFilePath],
  );

  const handleSave = useCallback(async () => {
    if (!appFileService) return;

    setIsSaving(true);

    try {
      const dirtyFiles = openFiles.filter((f) => f.isDirty);
      const changes = dirtyFiles.map((f) => ({
        operation: "update",
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
          prev.map((f) =>
            f.isDirty
              ? { ...f, isDirty: false, originalContent: f.content }
              : f,
          ),
        );
      }

      if (definitionDirtyRef.current && appDefinitionService) {
        await updateEntityRecord({
          service: appDefinitionService,
          payload: appDefinition,
        });
        definitionDirtyRef.current = false;
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    openFiles,
    appFileService,
    appDefinitionId,
    appDefinitionService,
    appDefinition,
  ]);

  const handleBuild = useCallback(async () => {
    if (!appBuildService) return;

    setBuildStatus("building");
    setBuildLog("");
    setBuildErrors([]);
    setIsBottomPanelOpen(true);

    try {
      await appBuildService.buildSingleStream(
        {
          app_definition_id: appDefinitionId,
          organization_id: appDefinition?.organization_id,
        },
        {
          onEvent: (event) => {
            if (event.event === "progress") {
              setBuildLog((prev) => prev + `${event.message || event.phase}\n`);
            } else if (event.event === "start") {
              setBuildLog(
                (prev) =>
                  prev +
                  `${event.message || `Starting build for ${event.slug}...`}\n`,
              );
            }
          },
          onComplete: (data) => {
            setBuildStatus(data.build_status || "success");
            if (data.build_log) {
              setBuildLog((prev) => prev + "\n" + data.build_log);
            }
            if (data.build_status === "success") {
              setHasBuild(true);
              setIsPublished(false);
            }
            if (data.build_status === "failed" && data.message) {
              setBuildErrors([data.message]);
            }
          },
          onError: (error) => {
            setBuildStatus("failed");
            setBuildErrors([error.message || "Build failed"]);
          },
        },
      );
    } catch (error) {
      setBuildStatus("failed");
      setBuildErrors([error.message || "Build failed"]);
    }
  }, [appBuildService, appDefinitionId, appDefinition]);

  const handlePublish = useCallback(async () => {
    if (!appBuildService || !appVersionService) return;

    setIsPublishing(true);
    setBuildStatus("building");
    setBuildLog("");
    setBuildErrors([]);
    setIsBottomPanelOpen(true);

    try {
      let buildSucceeded = false;

      await appBuildService.buildSingleStream(
        {
          app_definition_id: appDefinitionId,
          organization_id: appDefinition?.organization_id,
        },
        {
          onEvent: (event) => {
            if (event.event === "progress") {
              setBuildLog((prev) => prev + `${event.message || event.phase}\n`);
            } else if (event.event === "start") {
              setBuildLog(
                (prev) =>
                  prev +
                  `${event.message || `Starting build for ${event.slug}...`}\n`,
              );
            }
          },
          onComplete: (data) => {
            setBuildStatus(data.build_status || "success");
            if (data.build_log) {
              setBuildLog((prev) => prev + data.build_log + "\n");
            }
            if (data.build_status === "success") {
              buildSucceeded = true;
              setHasBuild(true);
            }
            if (data.build_status === "failed" && data.message) {
              setBuildErrors([data.message]);
            }
          },
          onError: (error) => {
            setBuildStatus("failed");
            setBuildErrors([error.message || "Build failed"]);
          },
        },
      );

      if (buildSucceeded) {
        setBuildLog(
          (prev) =>
            prev + " [LinkLoom]::[Cloud]::[AppBuild]:: Publishing version...\n",
        );

        const response = await appVersionService.publish({
          app_definition_id: appDefinitionId,
        });

        if (response?.result) {
          setBuildLog(
            (prev) =>
              prev +
              " [LinkLoom]::[Cloud]::[AppBuild]:: Version published successfully: " +
              (response.result.version || "") +
              "\n",
          );
          setIsPublished(true);
          setLatestVersion(response.result);
        }
      }
    } catch (error) {
      console.error("Failed to publish:", error);
      setBuildErrors([error.message || "Publish failed"]);
    } finally {
      setIsPublishing(false);
    }
  }, [appBuildService, appVersionService, appDefinitionId, appDefinition]);

  const handleUpdateDefinition = useCallback((updated) => {
    setAppDefinition(updated);
    definitionDirtyRef.current = true;
  }, []);

  const handlePreview = useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const handleRunApp = useCallback(() => {
    if (onRun) onRun(appDefinition);
  }, [onRun, appDefinition]);

  const handleToggleEditorTheme = useCallback(() => {
    setEditorTheme((prev) => (prev === "vs-dark" ? "vs" : "vs-dark"));
  }, []);

  const sidebarWidth = theme.fileExplorerWidth || STUDIO_UI_DEFAULTS.theme.fileExplorerWidth;

  const configWithTheme = { ...config, theme };

  return (
    <div
      className={className || undefined}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.background,
        overflow: "hidden",
      }}
    >
      <StudioToolbar
        appName={appDefinition?.name}
        isSaving={isSaving}
        isDirty={isDirty || definitionDirtyRef.current}
        buildStatus={buildStatus}
        onBack={onBack}
        onSave={handleSave}
        ui={configWithTheme}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          editorTheme={editorTheme}
          onToggleEditorTheme={handleToggleEditorTheme}
          ui={configWithTheme}
        />

        {activePanel && (
          <div
            style={{
              width: `${sidebarWidth}px`,
              minWidth: `${sidebarWidth}px`,
              height: "100%",
              overflow: "hidden",
              borderRight: `1px solid ${theme.border}`,
              backgroundColor: theme.panelBackground,
            }}
          >
            {activePanel === "explorer" && (
              <FileExplorer
                fileTree={fileTree}
                activeFilePath={activeFilePath}
                onFileSelect={handleFileSelect}
                ui={configWithTheme}
              />
            )}
            {activePanel === "properties" && (
              <PropertiesPanel
                appDefinition={appDefinition}
                onUpdateDefinition={handleUpdateDefinition}
                fileTree={fileTree}
                openFiles={openFiles}
                latestVersion={latestVersion}
                buildStatus={buildStatus}
                hasBuild={hasBuild}
                ui={configWithTheme}
              />
            )}
            {activePanel === "run" && (
              <RunPanel
                buildStatus={buildStatus}
                isPublishing={isPublishing}
                hasBuild={hasBuild}
                isPublished={isPublished}
                onBuild={handleBuild}
                onPreview={handlePreview}
                onPublish={handlePublish}
                onRun={handleRunApp}
                ui={configWithTheme}
              />
            )}
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <EditorArea
              openFiles={openFiles}
              activeFilePath={activeFilePath}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onContentChange={handleContentChange}
              editorTheme={editorTheme}
              ui={configWithTheme}
            />
          </Box>
          <BottomPanel
            buildLog={buildLog}
            buildErrors={buildErrors}
            isOpen={isBottomPanelOpen}
            onToggle={setIsBottomPanelOpen}
            ui={configWithTheme}
          />
        </div>
      </div>

      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: "90vw",
            height: "85vh",
            maxWidth: "90vw",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: theme.background,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.border}`,
            backgroundColor: theme.surface,
          }}
        >
          <Typography
            sx={{ fontSize: "13px", fontWeight: 600, color: theme.textPrimary }}
          >
            Preview — {appDefinition?.name || appDefinition?.slug}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsPreviewOpen(false)}
            sx={{ color: theme.textMuted }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, height: "100%", overflow: "hidden" }}>
          {isPreviewOpen && appDefinition?.slug && (
            <AppRuntimeHost
              appSlug={appDefinition.slug}
              routePath="/"
              launchMode="fullscreen"
              inputPayload={{}}
              appSessionService={appSessionService}
              apiBaseUrl={appDefinitionService?.serviceEndpoints?.baseUrl || ""}
              onClose={() => setIsPreviewOpen(false)}
              onSubmitOutput={() => setIsPreviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppStudio;

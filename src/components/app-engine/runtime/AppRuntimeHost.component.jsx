import React, { useState, useEffect, useRef, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { createRoot } from 'react-dom/client';

const RuntimeContainer = styled('div')(({ $launchMode }) => ({
  width: '100%',
  height: '100%',
  flex: $launchMode === 'fullscreen' ? 1 : 'none',
  minHeight: $launchMode === 'fullscreen' ? 0 : '400px',
  backgroundColor: '#2B2A33',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
}));

const LoadingState = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '400px',
  gap: '16px',
  color: '#9CA3AF',
});

const ErrorState = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '400px',
  gap: '12px',
  color: '#EF4444',
  padding: '24px',
});

const AppRuntimeHost = ({
  appSlug,
  routePath,
  launchMode = 'fullscreen',
  inputPayload = {},
  appSessionService,
  apiBaseUrl = '',
  onClose,
  onSubmitOutput,
  onNavigate,
}) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  const mountRef = useRef(null);
  const rootRef = useRef(null);
  const blobUrlRef = useRef(null);

  const openSession = useCallback(async () => {
    if (!appSessionService || !appSlug) return;

    setStatus('loading');
    setError(null);

    try {
      const response = await appSessionService.open({
        app_slug: appSlug,
        route_path: routePath || '/',
        launch_mode: launchMode,
        input_payload: inputPayload,
      });

      if (!response?.result) {
        throw new Error(response?.message || 'Failed to open session');
      }

      const { session: sessionData, app_version: version } = response.result;
      setSession(sessionData);

      if (!version?.build_artifact) {
        throw new Error('No build artifact available. Build and publish the app first.');
      }

      await loadAndMount(version.build_artifact, sessionData, response.result);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [appSessionService, appSlug, routePath, launchMode, inputPayload]);

  const loadAndMount = async (buildArtifact, sessionData, fullPayload) => {
    try {
      const entryFile = Object.keys(buildArtifact).find(
        (key) => key.endsWith('.js') || key.endsWith('.mjs')
      );

      if (!entryFile || !buildArtifact[entryFile]?.content) {
        throw new Error('No entry file found in build artifacts');
      }

      const code = buildArtifact[entryFile].content;
      const blob = new Blob([code], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const module = await import(/* @vite-ignore */ blobUrl);
      const AppComponent = module.default;

      if (!AppComponent) {
        throw new Error('App module does not export a default component');
      }

      const inputData = sessionData.input_payload || inputPayload;

      const sdk = {
        session: {
          id: sessionData.id,
          appId: sessionData.app_definition_id,
          appSlug: sessionData.app_slug,
          appVersionId: sessionData.app_version_id,
          launchMode: sessionData.launch_mode,
          routePath: sessionData.route_path,
        },
        input: inputData,
        context: {
          appDefinition: fullPayload.app_definition || {},
          appVersion: fullPayload.app_version || {},
          task: inputData?.task || null,
          data: inputData,
        },
        api: {
          get: async (path, params = {}) => {
            const qs = new URLSearchParams(params).toString();
            const url = `${apiBaseUrl}${path}${qs ? '?' + qs : ''}`;
            const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
            return res.json();
          },
          post: async (path, body = {}) => {
            const res = await fetch(`${apiBaseUrl}${path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            return res.json();
          },
          patch: async (path, body = {}) => {
            const res = await fetch(`${apiBaseUrl}${path}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            return res.json();
          },
          delete: async (path) => {
            const res = await fetch(`${apiBaseUrl}${path}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });
            return res.json();
          },
        },
        navigate: (path) => {
          if (onNavigate) onNavigate(path);
        },
        saveDraft: async (payload) => {
          if (appSessionService) {
            return appSessionService.saveDraft({ id: sessionData.id, draft_payload: payload });
          }
        },
        submitOutput: async (payload) => {
          if (appSessionService) {
            await appSessionService.submitOutput({ id: sessionData.id, output_payload: payload });
          }
          if (onSubmitOutput) onSubmitOutput(payload);
        },
        close: () => {
          if (onClose) onClose();
        },
        cancel: async (reason) => {
          if (appSessionService) {
            await appSessionService.cancel({ id: sessionData.id });
          }
          if (onClose) onClose();
        },
      };

      if (mountRef.current) {
        rootRef.current = createRoot(mountRef.current);
        rootRef.current.render(<AppComponent sdk={sdk} />);
        setStatus('running');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    openSession();

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [openSession]);

  if (status === 'loading') {
    return (
      <RuntimeContainer $launchMode={launchMode}>
        <LoadingState>
          <CircularProgress sx={{ color: '#7C3AED' }} />
          <Typography sx={{ fontSize: '14px' }}>Loading app...</Typography>
        </LoadingState>
      </RuntimeContainer>
    );
  }

  if (status === 'error') {
    return (
      <RuntimeContainer $launchMode={launchMode}>
        <ErrorState>
          <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>Failed to load app</Typography>
          <Typography sx={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', maxWidth: '400px' }}>
            {error}
          </Typography>
        </ErrorState>
      </RuntimeContainer>
    );
  }

  return (
    <RuntimeContainer $launchMode={launchMode}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </RuntimeContainer>
  );
};

export default AppRuntimeHost;

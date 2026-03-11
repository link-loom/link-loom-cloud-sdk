import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactRouterDOM from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const RuntimeContainer = styled('div')(({ $launchMode }) => ({
  width: '100%',
  height: '100%',
  flex: $launchMode === 'fullscreen' ? 1 : 'none',
  minHeight: $launchMode === 'fullscreen' ? 0 : '400px',
  backgroundColor: 'transparent',
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

const EMPTY_PAYLOAD = {};

// ── Runtime dependency shim infrastructure ─────────────────────────
// The Vite build config marks react/react-dom/react-router-dom as
// external and rewrites their import paths to $$LOOM_RUNTIME$$:<dep>
// tokens. At load time we replace those tokens (and bare specifiers
// for backward compat) with blob: URLs that re-export the host app's
// already-loaded modules.

const RUNTIME_WINDOW_KEY = '__LOOM_RUNTIME__';

const HOST_MODULES = {
  'react': React,
  'react/jsx-runtime': ReactJSXRuntime,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  'react-router-dom': ReactRouterDOM,
};

// Matches both tokenized imports ($$LOOM_RUNTIME$$:react) and bare
// specifiers (react) for backward compatibility with pre-token builds.
// Captures the keyword (from or import) to handle side-effect imports
// like `import "$$LOOM_RUNTIME$$:react"` in addition to named imports.
// Alternation order: longest prefixes first to avoid substring matches.
const EXTERNAL_IMPORT_PATTERN =
  /((?:from|import)\s*)(["'])(\$\$LOOM_RUNTIME\$\$:)?((?:@link-loom\/cloud-sdk|react-router-dom|react-dom|react)(?:\/[^"']*)?)\2/g;

const buildShimCode = (depKey) => {
  const moduleObj = window[RUNTIME_WINDOW_KEY]?.[depKey];

  if (!moduleObj) {
    return 'export default {};';
  }

  const lines = [`const m = window["${RUNTIME_WINDOW_KEY}"]["${depKey}"];`];

  if (typeof moduleObj === 'function' || moduleObj.default !== undefined) {
    lines.push('export default m.default !== undefined ? m.default : m;');
  } else {
    lines.push('export default m;');
  }

  if (typeof moduleObj === 'object' && moduleObj !== null) {
    Object.keys(moduleObj)
      .filter(
        (k) =>
          k !== 'default' &&
          k !== '__esModule' &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k),
      )
      .forEach((k) => lines.push(`export const ${k} = m["${k}"];`));
  }

  return lines.join('\n');
};

const prepareRuntimeCode = (rawCode) => {
  if (!window[RUNTIME_WINDOW_KEY]) {
    window[RUNTIME_WINDOW_KEY] = {};
  }

  for (const [key, mod] of Object.entries(HOST_MODULES)) {
    window[RUNTIME_WINDOW_KEY][key] = mod;
  }

  const shimUrls = {};
  const blobUrls = [];

  const getOrCreateShim = (depKey) => {
    if (shimUrls[depKey]) {
      return shimUrls[depKey];
    }

    if (!window[RUNTIME_WINDOW_KEY][depKey]) {
      window[RUNTIME_WINDOW_KEY][depKey] = HOST_MODULES[depKey] || {};
    }

    const shimCode = buildShimCode(depKey);
    const blob = new Blob([shimCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    shimUrls[depKey] = url;
    blobUrls.push(url);
    return url;
  };

  const processedCode = rawCode.replace(
    EXTERNAL_IMPORT_PATTERN,
    (_match, keyword, quote, _token, depKey) => {
      const shimUrl = getOrCreateShim(depKey);
      return `${keyword}${quote}${shimUrl}${quote}`;
    },
  );

  return { processedCode, blobUrls };
};

// ── End runtime dependency shim infrastructure ─────────────────────

const AppRuntimeHost = ({
  appSlug,
  routePath,
  launchMode = 'fullscreen',
  inputPayload,
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
  const shimBlobUrlsRef = useRef([]);
  const inputPayloadRef = useRef(inputPayload || EMPTY_PAYLOAD);
  inputPayloadRef.current = inputPayload || EMPTY_PAYLOAD;

  const openSession = useCallback(async () => {
    if (!appSessionService || !appSlug) return;

    setStatus('loading');
    setError(null);

    try {
      const response = await appSessionService.open({
        app_slug: appSlug,
        route_path: routePath || '/',
        launch_mode: launchMode,
        input_payload: inputPayloadRef.current,
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
  }, [appSessionService, appSlug, routePath, launchMode]);

  const loadAndMount = async (buildArtifact, sessionData, fullPayload) => {
    try {
      const entryFile = Object.keys(buildArtifact).find(
        (key) => key.endsWith('.js') || key.endsWith('.mjs'),
      );

      if (!entryFile || !buildArtifact[entryFile]?.content) {
        throw new Error('No entry file found in build artifacts');
      }

      const rawCode = buildArtifact[entryFile].content;
      const { processedCode, blobUrls: shimUrls } = prepareRuntimeCode(rawCode);
      shimBlobUrlsRef.current = shimUrls;

      const blob = new Blob([processedCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const module = await import(/* @vite-ignore */ blobUrl);
      const AppComponent = module.default;

      if (!AppComponent) {
        throw new Error('App module does not export a default component');
      }

      const inputData = sessionData.input_payload || inputPayloadRef.current;

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
        rootRef.current = ReactDOMClient.createRoot(mountRef.current);
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
      for (const url of shimBlobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      shimBlobUrlsRef.current = [];
    };
  }, [openSession]);

  return (
    <RuntimeContainer $launchMode={launchMode}>
      {status === 'loading' && (
        <LoadingState>
          <CircularProgress sx={{ color: '#7C3AED' }} />
          <Typography sx={{ fontSize: '14px' }}>Loading app...</Typography>
        </LoadingState>
      )}
      {status === 'error' && (
        <ErrorState>
          <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>Failed to load app</Typography>
          <Typography sx={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', maxWidth: '400px' }}>
            {error}
          </Typography>
        </ErrorState>
      )}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          display: status === 'running' ? 'block' : 'none',
        }}
      />
    </RuntimeContainer>
  );
};

export default AppRuntimeHost;

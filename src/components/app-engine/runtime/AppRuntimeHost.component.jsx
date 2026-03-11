import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactRouterDOM from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { RUNTIME_UI_DEFAULTS, mergeDefaults } from '../defaults/appEngine.defaults';
// Note: Optional SDK UI & Utils dependencies like @mui/material, recharts,
// and axios are intentionally NOT imported here to avoid bloating the SDK bundle
// and to prevent Rollup build failures. The host application should provide them
// globally or pass them through a mechanism if they want apps to use them.

// We will attempt to extract them from the global window object if the host
// has exposed them, otherwise they will remain undefined in the shim.
const resolveHostModule = (globalName) => {
  if (typeof window !== 'undefined' && window[globalName]) {
    return window[globalName];
  }
  return undefined;
};

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
  // Attempt to resolve optional host modules from global scope if provided by host.
  // The host application (e.g. Sommatic) is responsible for putting these in window
  // if it wants them to be available to App Engine apps.
  '@mui/material': resolveHostModule('MuiMaterial') || resolveHostModule('mui'),
  '@mui/icons-material': resolveHostModule('MuiIconsMaterial'),
  '@link-loom/react-sdk': resolveHostModule('LinkLoomReactSDK'),
  '@sommatic/react-sdk': resolveHostModule('SommaticReactSDK'),
  '@tanstack/react-query': resolveHostModule('ReactQuery'),
  'react-hook-form': resolveHostModule('ReactHookForm'),
  'zod': resolveHostModule('Zod'),
  'axios': resolveHostModule('axios'),
  'dayjs': resolveHostModule('dayjs'),
  'luxon': resolveHostModule('luxon'),
  'recharts': resolveHostModule('recharts'),
  'react-markdown': resolveHostModule('reactMarkdown')
};

// Matches both tokenized imports ($$LOOM_RUNTIME$$:react) and bare
// specifiers (react) for backward compatibility with pre-token builds.
// Captures the keyword (from or import) to handle side-effect imports
// like `import "$$LOOM_RUNTIME$$:react"` in addition to named imports.
// Alternation order: longest prefixes first to avoid substring matches.
const EXTERNAL_IMPORT_PATTERN =
  /((?:from|import)\s*)(["'])(\$\$LOOM_RUNTIME\$\$:)?((?:@link-loom\/cloud-sdk|@link-loom\/react-sdk|@sommatic\/react-sdk|@mui\/material|@mui\/icons-material|@tanstack\/react-query|react-hook-form|zod|react-router-dom|react-dom|react|axios|dayjs|luxon|recharts|react-markdown)(?:\/[^"']*)?)\2/g;

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
  ui,
  onClose,
  onSubmitOutput,
  onNavigate,
  className = '',
  renderLoading,
  renderError,
}) => {
  const config = mergeDefaults(RUNTIME_UI_DEFAULTS, ui);
  const theme = config.theme;
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

  const defaultLoadingContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: `${theme.minHeight}px`,
        gap: '16px',
        color: theme.textSecondary,
      }}
    >
      <CircularProgress sx={{ color: theme.spinnerColor }} />
      <Typography sx={{ fontSize: '14px' }}>{config.loadingText}</Typography>
    </div>
  );

  const defaultErrorContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: `${theme.minHeight}px`,
        gap: '12px',
        color: theme.errorColor,
        padding: '24px',
      }}
    >
      <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>{config.errorTitle}</Typography>
      <Typography sx={{ fontSize: '13px', color: theme.textSecondary, textAlign: 'center', maxWidth: '400px' }}>
        {error}
      </Typography>
    </div>
  );

  return (
    <div
      className={className || undefined}
      style={{
        width: '100%',
        height: '100%',
        flex: launchMode === 'fullscreen' ? 1 : 'none',
        minHeight: launchMode === 'fullscreen' ? 0 : `${theme.minHeight}px`,
        backgroundColor: 'transparent',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {status === 'loading' && (renderLoading ? renderLoading() : defaultLoadingContent)}
      {status === 'error' && (renderError ? renderError({ error }) : defaultErrorContent)}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          display: status === 'running' ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default AppRuntimeHost;

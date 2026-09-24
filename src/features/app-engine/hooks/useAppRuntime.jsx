import { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { createAppBackend } from '../runtime/backend/app-backend.client';
import { buildIdentityHeaders, readIdentitySession } from '../runtime/identity/identity-session';
import RuntimeHttpClient from '../runtime/shared/runtime-http.client';
import { createLoomClient, createSessionIdentityHeaders } from '../runtime/shared/loom-identity.client';

// `getIdentitySession` returns the host's Veripass session (`useAuth().getToken`): opening a session
// follows the App Engine access rule, so it is opened as that person and their organization.
export default function useAppRuntime({ appSessionService, getIdentitySession }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  const mountRef = useRef(null);
  const rootRef = useRef(null);
  const blobUrlRef = useRef(null);

  const cleanup = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const openApp = useCallback(async ({ appSlug, routePath, launchMode, inputPayload, onSubmitOutput, onClose, onNavigate }) => {
    if (!appSessionService || !appSlug) return;

    cleanup();
    setStatus('loading');
    setError(null);

    try {
      const response = await appSessionService.open(
        {
          app_slug: appSlug,
          route_path: routePath || '/',
          launch_mode: launchMode || 'fullscreen',
          input_payload: inputPayload || {},
        },
        { headers: createSessionIdentityHeaders(getIdentitySession?.()) },
      );

      if (!response?.result) {
        throw new Error(response?.message || 'Failed to open session');
      }

      const { session: sessionData, app_version: version } = response.result;
      setSession(sessionData);

      if (!version?.build_artifact) {
        throw new Error('No build artifact available');
      }

      const entryFile = Object.keys(version.build_artifact).find((key) => key.endsWith('.js') || key.endsWith('.mjs'));

      if (!entryFile || !version.build_artifact[entryFile]?.content) {
        throw new Error('No entry file found in build artifacts');
      }

      const blob = new Blob([version.build_artifact[entryFile].content], { type: 'application/javascript' });
      blobUrlRef.current = URL.createObjectURL(blob);

      const module = await import(/* @vite-ignore */ blobUrlRef.current);
      const AppComponent = module.default;

      if (!AppComponent) {
        throw new Error('App module does not export a default component');
      }

      const identitySession = readIdentitySession(getIdentitySession?.());
      const appBackend = createAppBackend({
        loom: createLoomClient(
          new RuntimeHttpClient({
            baseUrl: appSessionService.serviceEndpoints?.baseUrl || '',
            getHeaders: () => buildIdentityHeaders(identitySession, sessionData.id),
          }),
        ),
        appDefinition: response.result.app_definition,
        appSlug: sessionData.app_slug || appSlug,
      });

      const sdk = {
        session: {
          id: sessionData.id,
          appId: sessionData.app_definition_id,
          appSlug: sessionData.app_slug,
          appVersionId: sessionData.app_version_id,
          launchMode: sessionData.launch_mode,
          routePath: sessionData.route_path,
        },
        input: sessionData.input_payload || inputPayload || {},
        ...(appBackend ? { backend: appBackend } : {}),
        navigate: (path) => onNavigate?.(path),
        saveDraft: (payload) => appSessionService?.saveDraft({ id: sessionData.id, draft_payload: payload }),
        submitOutput: async (payload) => {
          await appSessionService?.submitOutput({ id: sessionData.id, output_payload: payload });
          onSubmitOutput?.(payload);
        },
        close: () => onClose?.(),
        cancel: async () => {
          await appSessionService?.cancel({ id: sessionData.id });
          onClose?.();
        },
      };

      return { AppComponent, sdk };
    } catch (err) {
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, [appSessionService, getIdentitySession, cleanup]);

  const mountApp = useCallback((containerRef, AppComponent, sdk) => {
    if (!containerRef?.current || !AppComponent) return;

    cleanup();
    mountRef.current = containerRef.current;
    rootRef.current = createRoot(containerRef.current);
    rootRef.current.render(<AppComponent sdk={sdk} />);
    setStatus('running');
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    error,
    session,
    openApp,
    mountApp,
    cleanup,
  };
}

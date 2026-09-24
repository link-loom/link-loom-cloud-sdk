import React, { useState, useEffect, useRef, useCallback } from "react";
import * as ReactDOMClient from "react-dom/client";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {
  RUNTIME_UI_DEFAULTS,
  mergeDefaults,
} from "../defaults/appEngine.defaults";
import {
  RUNTIME_WINDOW_KEY,
  STATIC_RUNTIME_MODULES,
  ensureRuntimeModules,
} from "./runtime-modules/runtime-modules.registry";
import IdentityVerification from "./identity/IdentityVerification.component";
import AppNotEntitledComponent from "./not-entitled/AppNotEntitled.component";
import { APP_ENGINE_ERROR_CODES } from "../../../features/app-engine/app-store/app-store.enums";
import RuntimeHttpClient from "../../../features/app-engine/runtime/shared/runtime-http.client";
import { createLoomClient } from "../../../features/app-engine/runtime/shared/loom-identity.client";
import { createAppBackend } from "../../../features/app-engine/runtime/backend/app-backend.client";
import { createUuid } from "../../../features/app-engine/runtime/shared/runtime-ids";
import {
  buildIdentityHeaders,
  buildSdkIdentity,
  isIdentityExpired,
  readIdentitySession,
  readVerifiedIdentity,
  verifyIdentityWithBackend,
  writeVerifiedIdentity,
} from "../../../features/app-engine/runtime/identity/identity-session";
import AppDataClient from "../../../features/app-engine/runtime/data/data-client";
import { buildAppDataNamespace } from "../../../features/app-engine/runtime/data/data-local.store";
import AppFilesClient from "../../../features/app-engine/runtime/files/files-client";
import { setRuntimeConfig } from "../../../features/app-engine/runtime/shared/runtime-config";
import AppDirectoryClient from "../../../features/app-engine/runtime/directory/directory-client";
import AppRealtimeHub from "../../../features/app-engine/runtime/realtime/app-realtime.hub";
import {
  flushOfflineSessionWrites,
  isOfflineSessionId,
  loadCachedAppBundle,
  queueOfflineSessionWrite,
  storeAppBundle,
} from "../../../features/app-engine/runtime/offline/app-bundle.cache";

const EMPTY_PAYLOAD = {};
const APP_NOTIFICATION_EVENT = "stoneos::app-notification";

// ── Runtime dependency shim infrastructure ─────────────────────────
// The App Engine build marks shared dependencies as external and rewrites
// their import paths to $$LOOM_RUNTIME$$:<dep> tokens. At load time the
// referenced modules are resolved (static registry, on-demand loaders or
// host registrations) and the tokens are replaced with blob: URLs that
// re-export them from window.__LOOM_RUNTIME__.

// Host-provided modules. The host application registers additional packages
// in window.__LOOM_RUNTIME__ via its own setup file (e.g. app-engine-runtime.js).
const HOST_MODULES = {
  ...STATIC_RUNTIME_MODULES,
};

// Merge any modules the host has already registered in __LOOM_RUNTIME__
// BEFORE the app loads. This allows hosts to expose arbitrary packages
// without modifying the SDK.
if (typeof window !== "undefined" && window[RUNTIME_WINDOW_KEY]) {
  for (const [key, mod] of Object.entries(window[RUNTIME_WINDOW_KEY])) {
    if (!HOST_MODULES[key]) {
      HOST_MODULES[key] = mod;
    }
  }
}

// Matches tokenized imports: $$LOOM_RUNTIME$$:package-name
// This pattern matches ANY package name after the token prefix,
// so the SDK does not need to be updated when new packages are added by the host.
const TOKENIZED_IMPORT_PATTERN =
  /((?:from|import)\s*)(["'])\$\$LOOM_RUNTIME\$\$:([^"']+)\2/g;

// Matches bare specifiers for backward compatibility with pre-token builds.
// Only matches packages registered in HOST_MODULES or __LOOM_RUNTIME__.
const buildBareSpecifierPattern = () => {
  const allKeys = new Set([
    ...Object.keys(HOST_MODULES),
    ...(typeof window !== "undefined" && window[RUNTIME_WINDOW_KEY]
      ? Object.keys(window[RUNTIME_WINDOW_KEY])
      : []),
  ]);

  if (allKeys.size === 0) return null;

  // Sort by length descending to avoid substring matches
  const escaped = Array.from(allKeys)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"));

  return new RegExp(
    `((?:from|import)\\s*)(["'])(${escaped.join("|")})(?:\\/[^"']*)?(\\2)`,
    "g",
  );
};

// Legacy combined pattern for backward compat (will be built dynamically)
let EXTERNAL_IMPORT_PATTERN = null;

// JavaScript reserved words that cannot be used as variable names in
// `export const <name> = ...` statements. Without this filter, modules
// like axios (which exports a function named `delete`) would generate
// invalid shim code such as `export const delete = m["delete"];`.
const JS_RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "finally",
  "for",
  "function",
  "if",
  "in",
  "instanceof",
  "new",
  "return",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "class",
  "const",
  "enum",
  "export",
  "extends",
  "import",
  "super",
  "implements",
  "interface",
  "let",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "yield",
]);

const buildShimCode = (depKey) => {
  const moduleObj = window[RUNTIME_WINDOW_KEY]?.[depKey];

  if (!moduleObj) {
    return "export default {};";
  }

  const lines = [`const m = window["${RUNTIME_WINDOW_KEY}"]["${depKey}"];`];

  if (typeof moduleObj === "function" || moduleObj.default !== undefined) {
    lines.push("export default m.default !== undefined ? m.default : m;");
  } else {
    lines.push("export default m;");
  }

  if (typeof moduleObj === "object" && moduleObj !== null) {
    Object.keys(moduleObj)
      .filter(
        (k) =>
          k !== "default" &&
          k !== "__esModule" &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) &&
          !JS_RESERVED_WORDS.has(k),
      )
      .forEach((k) => lines.push(`export const ${k} = m["${k}"];`));
  }

  return lines.join("\n");
};

const prepareRuntimeCode = (rawCode) => {
  if (!window[RUNTIME_WINDOW_KEY]) {
    window[RUNTIME_WINDOW_KEY] = {};
  }

  // Merge core + host-registered modules into the runtime registry
  for (const [key, mod] of Object.entries(HOST_MODULES)) {
    if (!window[RUNTIME_WINDOW_KEY][key]) {
      window[RUNTIME_WINDOW_KEY][key] = mod;
    }
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
    const blob = new Blob([shimCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    shimUrls[depKey] = url;
    blobUrls.push(url);
    return url;
  };

  // 1. Replace tokenized imports ($$LOOM_RUNTIME$$:package) — matches ANY package
  let processedCode = rawCode.replace(
    TOKENIZED_IMPORT_PATTERN,
    (_match, keyword, quote, depKey) => {
      const shimUrl = getOrCreateShim(depKey);
      return `${keyword}${quote}${shimUrl}${quote}`;
    },
  );

  // 2. Replace bare specifiers for backward compatibility
  const barePattern = buildBareSpecifierPattern();
  if (barePattern) {
    processedCode = processedCode.replace(
      barePattern,
      (_match, keyword, quote, depKey, endQuote) => {
        const shimUrl = getOrCreateShim(depKey);
        return `${keyword}${quote}${shimUrl}${endQuote}`;
      },
    );
  }

  return { processedCode, blobUrls };
};

// ── End runtime dependency shim infrastructure ─────────────────────

// What the embedding platform tells its apps about itself (e.g. { platform: 'mi-retail', name: 'Mi Retail',
// capabilities: ['work-items'], locale: 'es', timeZone: 'America/Bogota' }), exposed read-only as
// `sdk.context.host` (always the latest value; `sdk.context.onHostChange` reports locale/timeZone changes). JSON-safe values only: a copy
// is frozen so an app cannot change what other apps of the same host read.
const freezeHostContext = (hostContext) => {
  if (!hostContext || typeof hostContext !== "object" || Array.isArray(hostContext)) {
    return null;
  }

  let copy;
  try {
    copy = JSON.parse(JSON.stringify(hostContext));
  } catch {
    return null;
  }

  copy.capabilities = Object.freeze(Array.isArray(copy.capabilities) ? copy.capabilities.filter((entry) => typeof entry === "string") : []);
  return Object.freeze(copy);
};

const AppRuntimeHost = ({
  appSlug,
  routePath,
  launchMode = "fullscreen",
  inputPayload,
  appSessionService,
  apiBaseUrl = "",
  eventsBaseUrl,
  eventSubject,
  eventOrganizationId,
  getIdentitySession,
  loomCloudBaseUrl,
  hostContext,
  ui,
  onClose,
  onSubmitOutput,
  onNavigate,
  onRouteChange,
  onStateCapture,
  onRequestEscalation,
  onRequestDeEscalation,
  className = "",
  renderLoading,
  renderError,
  renderIdentityLoading,
}) => {
  const config = mergeDefaults(RUNTIME_UI_DEFAULTS, ui);
  const theme = config.theme;
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  const mountRef = useRef(null);
  const rootRef = useRef(null);
  const blobUrlRef = useRef(null);
  const shimBlobUrlsRef = useRef([]);
  const styleElementsRef = useRef([]);
  const inputPayloadRef = useRef(inputPayload || EMPTY_PAYLOAD);
  inputPayloadRef.current = inputPayload || EMPTY_PAYLOAD;
  const getIdentitySessionRef = useRef(getIdentitySession);
  getIdentitySessionRef.current = getIdentitySession;
  const hostContextRef = useRef(hostContext);
  hostContextRef.current = hostContext;
  const frozenHostRef = useRef({ key: undefined, value: null });
  const hostListenersRef = useRef(new Set());
  const stateProviderRef = useRef(null);
  const runtimeDisposersRef = useRef([]);
  // Bumped on unmount: an openSession still awaiting when the effect is torn down (StrictMode, fast
  // navigation) must not mount a second app or open realtime connections nobody will release.
  const mountGenerationRef = useRef(0);

  // Latest frozen host context; a new frozen copy is only built when the serialized value changes.
  const readHostContext = () => {
    let key;
    try {
      key = JSON.stringify(hostContextRef.current ?? null);
    } catch {
      key = "";
    }
    if (frozenHostRef.current.key !== key) {
      frozenHostRef.current = { key, value: freezeHostContext(hostContextRef.current) };
    }
    return frozenHostRef.current.value;
  };

  const hostLocale = hostContext?.locale;
  const hostTimeZone = hostContext?.timeZone;
  const hostSignatureRef = useRef({ locale: hostLocale, timeZone: hostTimeZone });

  useEffect(() => {
    const previous = hostSignatureRef.current;
    if (previous.locale === hostLocale && previous.timeZone === hostTimeZone) return;
    hostSignatureRef.current = { locale: hostLocale, timeZone: hostTimeZone };
    const host = readHostContext();
    for (const listener of Array.from(hostListenersRef.current)) {
      try {
        listener(host);
      } catch {
        // A failing app listener must not break the host or other listeners.
      }
    }
  }, [hostLocale, hostTimeZone]);

  const resolveLoomBaseUrl = () =>
    loomCloudBaseUrl || appSessionService?.serviceEndpoints?.baseUrl || "";

  const buildOpenRequest = () => {
    const currentInput = inputPayloadRef.current;
    return {
      app_slug: appSlug,
      route_path: routePath || "/",
      launch_mode: launchMode,
      input_payload: currentInput,
      parent_session_id: currentInput?._parent_session_id || "",
      view_state: currentInput?._restored_view_state || null,
    };
  };

  // Identity phase: a cached verification (same token, not expired) skips the round trip. Only an
  // explicit 401/403 blocks the app; network or directory failures continue because the backend
  // still authorizes every request.
  const verifyIdentity = async (identitySession, loomBaseUrl) => {
    if (isIdentityExpired(identitySession)) {
      setError("Your Veripass session has expired. Sign in again to continue.");
      setStatus("identity-error");
      return { verified: false };
    }

    const cached = await readVerifiedIdentity(identitySession);
    if (cached) {
      return { verified: true, profile: cached.profile };
    }

    setStatus("identity");
    const httpClient = new RuntimeHttpClient({
      baseUrl: loomBaseUrl,
      getHeaders: () => buildIdentityHeaders(identitySession),
    });

    try {
      const profile = await verifyIdentityWithBackend({ httpClient, identitySession });
      await writeVerifiedIdentity(identitySession, profile);
      return { verified: true, profile };
    } catch (err) {
      if (err.status !== 401 && err.status !== 403) {
        return { verified: true, profile: null };
      }
      setError(err.message);
      setStatus("identity-error");
      return { verified: false };
    }
  };

  const resolveOfflinePayload = async (identitySession) => {
    if (identitySession && isIdentityExpired(identitySession)) {
      return null;
    }

    const cached = await loadCachedAppBundle(appSlug);
    if (!cached?.app_version?.build_artifact) {
      return null;
    }

    return {
      ...cached,
      session: {
        ...cached.session,
        id: `offline-${createUuid()}`,
        input_payload: inputPayloadRef.current,
        route_path: routePath || "/",
        launch_mode: launchMode,
      },
    };
  };

  const openSession = useCallback(async () => {
    if (!appSessionService || !appSlug) return;

    const generation = mountGenerationRef.current;
    const isStale = () => generation !== mountGenerationRef.current;

    setError(null);
    const identitySession = readIdentitySession(getIdentitySessionRef.current?.());
    const loomBaseUrl = resolveLoomBaseUrl();
    let directoryProfile = null;

    if (identitySession) {
      const identityOutcome = await verifyIdentity(identitySession, loomBaseUrl);
      if (isStale() || !identityOutcome.verified) return;
      directoryProfile = identityOutcome.profile;
    }

    setStatus("loading");

    try {
      const response = await appSessionService.open(buildOpenRequest(), {
        headers: buildIdentityHeaders(identitySession),
      });
      if (isStale()) return;

      // BaseApi resolves network failures to undefined; a server answer always carries a body.
      const openPayload =
        response?.result ||
        (response ? null : await resolveOfflinePayload(identitySession));

      // The organization can see this app but does not have it: that is a way to the store, not an error.
      if (!openPayload && response?.error_code === APP_ENGINE_ERROR_CODES.appNotEntitled) {
        setStatus("not-entitled");
        return;
      }

      if (!openPayload) {
        throw new Error(response?.message || "Failed to open session");
      }

      const { session: sessionData, app_version: version } = openPayload;
      setSession(sessionData);

      if (!version?.build_artifact) {
        throw new Error(
          "No build artifact available. Build and publish the app first.",
        );
      }

      if (!isOfflineSessionId(sessionData.id)) {
        storeAppBundle(appSlug, openPayload);
        flushOfflineSessionWrites(appSlug, sessionData.id, appSessionService).catch(() => {});
      }

      await loadAndMount(version.build_artifact, sessionData, openPayload, {
        identitySession,
        directoryProfile,
        loomBaseUrl,
        isStale,
      });
    } catch (err) {
      if (isStale()) return;
      setError(err.message);
      setStatus("error");
    }
  }, [appSessionService, appSlug, routePath, launchMode, loomCloudBaseUrl]);

  const loadAndMount = async (buildArtifact, sessionData, fullPayload, runtimeContext) => {
    try {
      const entryFile = Object.keys(buildArtifact).find(
        (key) => key.endsWith(".js") || key.endsWith(".mjs"),
      );

      if (!entryFile || !buildArtifact[entryFile]?.content) {
        throw new Error("No entry file found in build artifacts");
      }

      const rawCode = buildArtifact[entryFile].content;
      await ensureRuntimeModules(rawCode);
      const { processedCode, blobUrls: shimUrls } = prepareRuntimeCode(rawCode);

      const blob = new Blob([processedCode], {
        type: "application/javascript",
      });
      const blobUrl = URL.createObjectURL(blob);

      let module;
      try {
        module = await import(/* @vite-ignore */ blobUrl);
      } finally {
        if (runtimeContext.isStale()) {
          URL.revokeObjectURL(blobUrl);
          shimUrls.forEach((url) => URL.revokeObjectURL(url));
        }
      }
      if (runtimeContext.isStale()) return;

      shimBlobUrlsRef.current = shimUrls;
      blobUrlRef.current = blobUrl;
      const cssFiles = Object.keys(buildArtifact).filter((k) =>
        k.endsWith(".css"),
      );
      for (const cssFile of cssFiles) {
        if (buildArtifact[cssFile]?.content) {
          const style = document.createElement("style");
          style.setAttribute("data-loom-app", appSlug || "unknown");
          style.textContent = buildArtifact[cssFile].content;
          document.head.appendChild(style);
          styleElementsRef.current.push(style);
        }
      }

      const AppComponent = module.default;

      if (!AppComponent) {
        throw new Error("App module does not export a default component");
      }

      const mergedPayload =
        sessionData.input_payload || inputPayloadRef.current;
      const inputData = {
        ...mergedPayload,
        _loom_route_path: sessionData.route_path || routePath || "/",
        _loom_launch_mode: sessionData.launch_mode || launchMode,
      };

      const { identitySession, directoryProfile, loomBaseUrl } = runtimeContext;
      const resolvedAppSlug = sessionData.app_slug || appSlug;
      const sdkIdentity = buildSdkIdentity(identitySession, directoryProfile);

      // Offline sessions have no server-side id: syncing waits until a real session is reopened.
      const activeSessionRef = {
        current: isOfflineSessionId(sessionData.id) ? null : sessionData.id,
      };
      const identityHeaders = () =>
        buildIdentityHeaders(identitySession, activeSessionRef.current);
      const canSync = () =>
        globalThis.navigator?.onLine !== false &&
        Boolean(identitySession) &&
        Boolean(activeSessionRef.current);

      setRuntimeConfig({ loomCloudBaseUrl: loomBaseUrl });

      const loomHttp = new RuntimeHttpClient({
        baseUrl: loomBaseUrl,
        getHeaders: identityHeaders,
      });
      const loomClient = createLoomClient(loomHttp);
      // Only an app whose definition declares its namespace (`backend: { namespace }`) gets `sdk.backend`.
      const appBackend = createAppBackend({
        loom: loomClient,
        appDefinition: fullPayload.app_definition,
        appSlug: resolvedAppSlug,
      });

      // Signals (realtime, one-way) — one SSE connection per app session, lazily created.
      const buildSubjectChannel = () => {
        if (!eventSubject) return null;
        if (typeof eventSubject === "string") return eventSubject;
        if (eventSubject.type && eventSubject.id)
          return `${eventSubject.type}:${eventSubject.id}`;
        return eventSubject.id || null;
      };
      const realtimeHub = new AppRealtimeHub({
        baseUrl: eventsBaseUrl || loomBaseUrl || apiBaseUrl,
        getParams: () => ({
          subject_type:
            typeof eventSubject === "object" ? eventSubject?.type : undefined,
          subject_id:
            typeof eventSubject === "object" ? eventSubject?.id : eventSubject,
          platform: "app",
          organization_id: identitySession?.organizationId || eventOrganizationId,
          access_token: identitySession?.token,
          app_session_id: activeSessionRef.current,
        }),
      });
      let subjectChannelAdded = false;
      const ensureSubjectChannel = () => {
        if (subjectChannelAdded) return;
        subjectChannelAdded = true;
        realtimeHub.addChannel(buildSubjectChannel());
        realtimeHub.ensureStream();
      };
      const namedSignalDisposers = new Map();

      const dataClient = new AppDataClient({
        http: loomHttp,
        appSlug: resolvedAppSlug,
        veripassIdentity: identitySession?.veripassIdentity,
        organizationId: identitySession?.organizationId,
        realtime: realtimeHub,
        isOnline: canSync,
      });
      const filesClient = new AppFilesClient({
        http: loomHttp,
        namespace: buildAppDataNamespace({
          veripassIdentity: identitySession?.veripassIdentity,
          organizationId: identitySession?.organizationId,
          appSlug: resolvedAppSlug,
        }),
        isOnline: canSync,
      });
      const directoryClient = new AppDirectoryClient({ http: loomHttp });

      const saveSessionViewState = (state) => {
        if (!appSessionService) return undefined;
        if (!activeSessionRef.current) {
          queueOfflineSessionWrite(resolvedAppSlug, {
            view_state: state,
            route_path: state?.currentRoute,
          });
          return undefined;
        }
        return appSessionService.saveViewState({
          id: activeSessionRef.current,
          view_state: state,
          route_path: state?.currentRoute,
        });
      };

      const reopenRealSession = async () => {
        if (activeSessionRef.current || !appSessionService) return;
        const response = await appSessionService.open(buildOpenRequest(), {
          headers: buildIdentityHeaders(identitySession),
        });
        const reopened = response?.result?.session;
        if (!reopened?.id) return;
        activeSessionRef.current = reopened.id;
        sdk.session.id = reopened.id;
        await flushOfflineSessionWrites(resolvedAppSlug, reopened.id, appSessionService);
      };

      const handleOnline = async () => {
        await reopenRealSession().catch(() => {});
        dataClient.sync();
        filesClient.replayQueue();
      };

      const apiRequest = async (method, path, body, { withIdentity = false } = {}) => {
        const res = await fetch(`${apiBaseUrl}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(withIdentity ? identityHeaders() : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        return res.json();
      };

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
        identity: sdkIdentity,
        context: {
          appDefinition: fullPayload.app_definition || {},
          appVersion: fullPayload.app_version || {},
          task: inputData?.task || null,
          data: inputData,
          user: sdkIdentity,
          loomCloudBaseUrl: loomBaseUrl,
          get host() {
            return readHostContext();
          },
          // Fires with the latest `host` when the host's locale or timeZone changes; returns the unsubscribe.
          onHostChange: (callback) => {
            if (typeof callback !== "function") return () => {};
            hostListenersRef.current.add(callback);
            return () => hostListenersRef.current.delete(callback);
          },
        },
        data: dataClient.toSdk(),
        files: filesClient.toSdk(),
        directory: directoryClient.toSdk(),
        loom: loomClient,
        ...(appBackend ? { backend: appBackend } : {}),
        notify: (notification = {}) => {
          window.dispatchEvent(
            new CustomEvent(APP_NOTIFICATION_EVENT, {
              detail: { appSlug: resolvedAppSlug, ...notification },
            }),
          );
        },
        api: {
          get: async (path, params = {}, options = {}) => {
            const qs = new URLSearchParams(params).toString();
            return apiRequest("GET", `${path}${qs ? "?" + qs : ""}`, undefined, options);
          },
          post: async (path, body = {}, options = {}) =>
            apiRequest("POST", path, body, options),
          patch: async (path, body = {}, options = {}) =>
            apiRequest("PATCH", path, body, options),
          delete: async (path, body, options = {}) =>
            apiRequest("DELETE", path, body, options),
        },
        navigate: (path) => {
          if (onNavigate) onNavigate(path);
        },
        onRouteChange: (path) => {
          if (onRouteChange) onRouteChange(path);
        },
        saveDraft: async (payload) => {
          if (!appSessionService) return undefined;
          if (!activeSessionRef.current) {
            queueOfflineSessionWrite(resolvedAppSlug, { draft_payload: payload });
            return undefined;
          }
          return appSessionService.saveDraft({
            id: activeSessionRef.current,
            draft_payload: payload,
          });
        },
        submitOutput: async (payload) => {
          if (appSessionService && activeSessionRef.current) {
            await appSessionService.submitOutput({
              id: activeSessionRef.current,
              output_payload: payload,
            });
          }
          if (onSubmitOutput) onSubmitOutput(payload);
        },
        close: () => {
          if (onClose) onClose();
        },
        cancel: async () => {
          if (appSessionService && activeSessionRef.current) {
            await appSessionService.cancel({ id: activeSessionRef.current });
          }
          if (onClose) onClose();
        },
        saveViewState: async (state) => saveSessionViewState(state),
        requestEscalation: async (targetMode) => {
          const currentState = stateProviderRef.current?.() ?? null;
          if (currentState) {
            Promise.resolve(saveSessionViewState(currentState)).catch(() => {});
          }
          if (onRequestEscalation) {
            onRequestEscalation({
              sessionId: sdk.session.id,
              targetMode,
              viewState: currentState,
              routePath: currentState?.currentRoute || routePath,
            });
          }
        },
        requestDeEscalation: async () => {
          const currentState = stateProviderRef.current?.() ?? null;
          if (currentState) {
            Promise.resolve(saveSessionViewState(currentState)).catch(() => {});
          }
          if (onRequestDeEscalation) {
            onRequestDeEscalation({
              sessionId: sdk.session.id,
              viewState: currentState,
              routePath: currentState?.currentRoute || routePath,
            });
          }
        },
        registerStateProvider: (fn) => {
          stateProviderRef.current = fn;
        },
        getState: () => {
          if (stateProviderRef.current) {
            return stateProviderRef.current();
          }
          return null;
        },
        signals: {
          // Subscribe this app session to an additional channel and get back its unsubscribe function.
          // `user:` and `app-data:` channels require the identity session (sent as access_token).
          subscribe: (channel) => {
            ensureSubjectChannel();
            const removeChannel = realtimeHub.addChannel(channel);
            realtimeHub.ensureStream();
            return removeChannel;
          },
          // Listen for a named signal (e.g. sdk.signals.on('session.revoke', cb)).
          on: (signalName, cb) => {
            ensureSubjectChannel();
            const dispose = realtimeHub.on(signalName, (payload) => cb(payload));
            const disposers = namedSignalDisposers.get(signalName) || [];
            namedSignalDisposers.set(signalName, [...disposers, dispose]);
          },
          off: (signalName) => {
            (namedSignalDisposers.get(signalName) || []).forEach((dispose) => dispose());
            namedSignalDisposers.delete(signalName);
          },
          // Listen for a named signal and get back its own unsubscribe function.
          listen: (signalName, cb) => {
            ensureSubjectChannel();
            return realtimeHub.on(signalName, (payload) => cb(payload));
          },
          // Send a one-way signal to a channel. Signals live on the Link Loom Cloud backend (the same one the
          // stream reads), never on the host API.
          send: async (channel, name, payload = {}) =>
            sdk.loom.post("/communication/signal/send", { channel, name, payload }),
          disconnect: () => realtimeHub.disconnect(),
        },
      };

      window.addEventListener("online", handleOnline);
      dataClient.start();
      filesClient.replayQueue();
      runtimeDisposersRef.current = [
        () => window.removeEventListener("online", handleOnline),
        () => dataClient.dispose(),
        () => filesClient.dispose(),
        () => realtimeHub.dispose(),
        () => hostListenersRef.current.clear(),
      ];

      if (mountRef.current) {
        rootRef.current = ReactDOMClient.createRoot(mountRef.current);
        rootRef.current.render(<AppComponent sdk={sdk} />);
        setStatus("running");
      }
    } catch (err) {
      if (runtimeContext.isStale()) return;
      setError(err.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    openSession();

    return () => {
      mountGenerationRef.current += 1;
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
      for (const styleEl of styleElementsRef.current) {
        styleEl.remove();
      }
      styleElementsRef.current = [];
      for (const dispose of runtimeDisposersRef.current) {
        dispose();
      }
      runtimeDisposersRef.current = [];
    };
  }, [openSession]);

  // DOM-event bridge: many app-side AppHeader components dispatch escalation
  // requests as `sommatic:app:request-escalation` / `request-de-escalation`
  // events instead of calling `sdk.requestEscalation(...)` directly. We listen
  // here and filter by session id so only the host bound to that session
  // reacts.
  useEffect(() => {
    const currentSessionId = session?.id;
    if (!currentSessionId) return undefined;

    const captureViewState = () => {
      const currentState = stateProviderRef.current?.() ?? null;
      if (currentState && appSessionService && !isOfflineSessionId(currentSessionId)) {
        appSessionService
          .saveViewState({
            id: currentSessionId,
            view_state: currentState,
            route_path: currentState?.currentRoute,
          })
          .catch(() => {});
      }
      return currentState;
    };

    const handleEscalation = (event) => {
      const detail = event?.detail || {};
      if (detail.sessionId && detail.sessionId !== currentSessionId) return;
      const viewState = captureViewState();
      if (onRequestEscalation) {
        onRequestEscalation({
          sessionId: currentSessionId,
          targetMode: detail.targetMode,
          viewState,
          routePath: viewState?.currentRoute || routePath,
        });
      }
    };

    const handleDeEscalation = (event) => {
      const detail = event?.detail || {};
      if (detail.sessionId && detail.sessionId !== currentSessionId) return;
      const viewState = captureViewState();
      if (onRequestDeEscalation) {
        onRequestDeEscalation({
          sessionId: currentSessionId,
          viewState,
          routePath: viewState?.currentRoute || routePath,
        });
      }
    };

    window.addEventListener(
      "sommatic:app:request-escalation",
      handleEscalation,
    );
    window.addEventListener(
      "sommatic:app:request-de-escalation",
      handleDeEscalation,
    );

    return () => {
      window.removeEventListener(
        "sommatic:app:request-escalation",
        handleEscalation,
      );
      window.removeEventListener(
        "sommatic:app:request-de-escalation",
        handleDeEscalation,
      );
    };
  }, [
    session?.id,
    appSessionService,
    onRequestEscalation,
    onRequestDeEscalation,
    routePath,
  ]);

  const defaultLoadingContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: `${theme.minHeight}px`,
        gap: "16px",
        color: theme.textSecondary,
      }}
    >
      <CircularProgress sx={{ color: theme.spinnerColor }} />
      <Typography sx={{ fontSize: "14px" }}>{config.loadingText}</Typography>
    </div>
  );

  const defaultErrorContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: `${theme.minHeight}px`,
        gap: "12px",
        color: theme.errorColor,
        padding: "24px",
      }}
    >
      <Typography sx={{ fontSize: "16px", fontWeight: 500 }}>
        {config.errorTitle}
      </Typography>
      <Typography
        sx={{
          fontSize: "13px",
          color: theme.textSecondary,
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        {error}
      </Typography>
    </div>
  );

  return (
    <div
      className={className || undefined}
      style={{
        width: "100%",
        height: "100%",
        flex: launchMode === "fullscreen" ? 1 : "none",
        minHeight: launchMode === "fullscreen" ? 0 : `${theme.minHeight}px`,
        backgroundColor: "transparent",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {status === "identity" &&
        (renderIdentityLoading ? (
          renderIdentityLoading()
        ) : (
          <IdentityVerification
            status="verifying"
            minHeight={theme.minHeight}
            textColor={theme.textSecondary}
          />
        ))}
      {status === "identity-error" && (
        <IdentityVerification
          status="error"
          error={error}
          onRetry={openSession}
          minHeight={theme.minHeight}
          textColor={theme.textSecondary}
          errorColor={theme.errorColor}
        />
      )}
      {status === "loading" &&
        (renderLoading ? renderLoading() : defaultLoadingContent)}
      {status === "error" &&
        (renderError ? renderError({ error }) : defaultErrorContent)}
      {status === "not-entitled" && <AppNotEntitledComponent appSlug={appSlug} minHeight={`${theme.minHeight}px`} />}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          display: status === "running" ? "block" : "none",
        }}
      />
    </div>
  );
};

export default AppRuntimeHost;

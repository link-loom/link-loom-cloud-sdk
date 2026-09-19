import { useEffect, useRef } from "react";
import AppRealtimeHub from "../features/app-engine/runtime/realtime/app-realtime.hub";

/**
 * useSignals — subscribe a browser client to Link Loom Cloud Signals (live, one-way).
 *
 * @param {object} options
 * @param {string} options.baseUrl - LLC backend base URL (e.g. import.meta.env.VITE_APP_BACKEND_URL)
 * @param {string[]} options.channels - channels to subscribe to (fixed slugs and/or dynamic like "user:<veripass_identity>").
 *   `user:` and `app-data:` channels require identity: pass `accessToken` (and `appSessionId` for app-data channels).
 * @param {string} [options.subjectType] - "user" | "system" (informational, permissive v1)
 * @param {string} [options.subjectId]
 * @param {string} [options.platform]
 * @param {string} [options.organizationId] - owning organization; lets the admin "Connected clients" view scope by org
 * @param {string} [options.accessToken] - Veripass user JWT, sent as `access_token` (EventSource cannot send headers)
 * @param {string} [options.appSessionId] - App Engine session id, sent as `app_session_id`
 * @param {string[]} options.signals - the signal names to listen for (e.g. ["session.revoke"]). Required over the
 *   browser transport: the native EventSource only delivers NAMED events to a matching listener and cannot
 *   wildcard, so onSignal fires once per named signal. For wildcard "receive everything" in Node, use SignalConsumer.
 * @param {boolean} [options.enabled=true]
 * @param {(signalName: string, data: any, event: MessageEvent) => void} options.onSignal
 *
 * Connections are shared page-wide with the app runtime (one SSE connection per identical stream params),
 * with exponential backoff on errors; the returned ref holds the consumer (`ref.current.connected`).
 */
export default function useSignals({
  baseUrl,
  channels = [],
  subjectType,
  subjectId,
  platform,
  organizationId,
  accessToken,
  appSessionId,
  signals = [],
  enabled = true,
  onSignal,
} = {}) {
  const streamRef = useRef(null);
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  const channelsKey = Array.isArray(channels) ? channels.join(",") : "";
  const signalsKey = Array.isArray(signals) ? signals.join(",") : "";

  useEffect(() => {
    if (!enabled || !channelsKey) {
      return undefined;
    }

    const hub = new AppRealtimeHub({
      baseUrl,
      getParams: () => ({
        subject_type: subjectType,
        subject_id: subjectId,
        platform,
        organization_id: organizationId,
        access_token: accessToken,
        app_session_id: appSessionId,
      }),
    });

    const names = signalsKey ? signalsKey.split(",") : [];

    if (!names.length && typeof console !== "undefined") {
      // The native EventSource only routes NAMED events to a matching listener — it cannot wildcard —
      // so without explicit `signals` names nothing would be received. Warn instead of failing silently.
      console.warn(
        "[useSignals] No `signals` names provided; nothing will be received over the browser transport. " +
          "List the signal names to listen for (e.g. signals: ['session.revoke']). For wildcard receive in Node, use SignalConsumer.",
      );
    }

    for (const name of names) {
      hub.on(name, (data, signalName, event) => onSignalRef.current?.(signalName, data, event));
    }
    channelsKey.split(",").forEach((channel) => hub.addChannel(channel));
    streamRef.current = hub;

    return () => {
      hub.dispose();
      streamRef.current = null;
    };
  }, [
    baseUrl,
    channelsKey,
    subjectType,
    subjectId,
    platform,
    organizationId,
    accessToken,
    appSessionId,
    signalsKey,
    enabled,
  ]);

  return streamRef;
}

import { useEffect, useRef } from "react";
import SignalStream from "../streams/communication/signal/signal-stream";

/**
 * useSignals — subscribe a browser client to Link Loom Cloud Signals (live, one-way).
 *
 * @param {object} options
 * @param {string} options.baseUrl - LLC backend base URL (e.g. import.meta.env.VITE_APP_BACKEND_URL)
 * @param {string[]} options.channels - channels to subscribe to (fixed slugs and/or dynamic like "user:U1")
 * @param {string} [options.subjectType] - "user" | "system" (informational, permissive v1)
 * @param {string} [options.subjectId]
 * @param {string} [options.platform]
 * @param {string} [options.organizationId] - owning organization; lets the admin "Connected clients" view scope by org
 * @param {string[]} options.signals - the signal names to listen for (e.g. ["session.revoke"]). Required over the
 *   browser transport: the native EventSource only delivers NAMED events to a matching listener and cannot
 *   wildcard, so onSignal fires once per named signal. For wildcard "receive everything" in Node, use SignalConsumer.
 * @param {boolean} [options.enabled=true]
 * @param {(signalName: string, data: any, event: MessageEvent) => void} options.onSignal
 * @param {number} [options.reconnectMs]
 */
export default function useSignals({
  baseUrl,
  channels = [],
  subjectType,
  subjectId,
  platform,
  organizationId,
  signals = [],
  enabled = true,
  onSignal,
  reconnectMs,
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

    const stream = new SignalStream({ baseUrl, reconnectMs });
    stream.setParams({
      channels: channelsKey,
      subject_type: subjectType,
      subject_id: subjectId,
      platform,
      organization_id: organizationId,
    });

    const names = signalsKey ? signalsKey.split(",") : [];

    if (names.length) {
      for (const name of names) {
        stream.on(name, (data, event) =>
          onSignalRef.current?.(name, data, event),
        );
      }
    } else if (typeof console !== "undefined") {
      // The native EventSource only routes NAMED events to a matching listener — it cannot wildcard —
      // so without explicit `signals` names nothing would be received. Warn instead of failing silently.
      console.warn(
        "[useSignals] No `signals` names provided; nothing will be received over the browser transport. " +
          "List the signal names to listen for (e.g. signals: ['session.revoke']). For wildcard receive in Node, use SignalConsumer.",
      );
    }

    stream.connect();
    streamRef.current = stream;

    return () => {
      stream.disconnect();
      streamRef.current = null;
    };
  }, [
    baseUrl,
    channelsKey,
    subjectType,
    subjectId,
    platform,
    organizationId,
    signalsKey,
    enabled,
    reconnectMs,
  ]);

  return streamRef;
}

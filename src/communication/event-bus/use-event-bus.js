import { useEffect, useRef, useState } from "react";
import EventBusConsumer from "./consumer";

/**
 * useEventBus — consume a Link Loom Cloud Event Bus topic from a React client.
 *
 * A thin lifecycle wrapper over EventBusConsumer: it catches up from the group's committed offset, tails
 * live, commits on success and dead-letters after the retry budget — the same durable contract as the Node
 * consumer. Unlike Signals (ephemeral), nothing is missed while the component is unmounted: the group's
 * committed offset persists server-side, so the next mount resumes exactly where it left off.
 *
 * Because a browser tab is a real consumer-group member, prefer a **dedicated group per surface** (e.g.
 * `dashboard-ui`) rather than sharing a backend worker's group — members of one group split partitions
 * between them.
 *
 * @param {object} options
 * @param {string} options.baseUrl - LLC backend base URL.
 * @param {string} options.apiKey - API key; the Event Bus is gated and scoped by it.
 * @param {string} options.topic
 * @param {string} options.group - Consumer group slug (its committed offsets are durable).
 * @param {string} [options.organizationId]
 * @param {boolean} [options.enabled=true]
 * @param {(context: { payload, message, ack, nack, attempt }) => any} options.onMessage
 * @param {boolean} [options.autoCommit=true] - Resolve without an explicit ack/nack to commit.
 * @param {number} [options.maxAttempts]
 * @param {number} [options.backoffMs]
 * @param {(error: Error) => void} [options.onError]
 * @param {(message: object, error: Error) => void} [options.onDeadLetter]
 * @returns {{ consumer: object|null, partitions: number[], connected: boolean }}
 */
export default function useEventBus({
  baseUrl,
  apiKey,
  topic,
  group,
  organizationId,
  enabled = true,
  onMessage,
  autoCommit = true,
  maxAttempts,
  backoffMs,
  onError,
  onDeadLetter,
} = {}) {
  const consumerRef = useRef(null);
  const [partitions, setPartitions] = useState([]);
  const [connected, setConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onDeadLetterRef = useRef(onDeadLetter);
  onDeadLetterRef.current = onDeadLetter;

  useEffect(() => {
    if (!enabled || !topic || !group) {
      return undefined;
    }

    let disposed = false;

    const consumer = new EventBusConsumer({
      baseUrl,
      apiKey,
      topic,
      group,
      organizationId,
      autoCommit,
      maxAttempts,
      backoffMs,
      onAssigned: (assigned) => {
        if (!disposed) {
          setPartitions(assigned);
        }
      },
      onError: (error) => onErrorRef.current?.(error),
      onDeadLetter: (message, error) =>
        onDeadLetterRef.current?.(message, error),
    });

    consumerRef.current = consumer;

    consumer
      .run((context) => onMessageRef.current?.(context))
      .then(() => {
        if (!disposed) {
          setConnected(true);
        }
      })
      .catch((error) => onErrorRef.current?.(error));

    return () => {
      disposed = true;
      consumer.disconnect();
      consumerRef.current = null;
      setConnected(false);
      setPartitions([]);
    };
  }, [
    baseUrl,
    apiKey,
    topic,
    group,
    organizationId,
    enabled,
    autoCommit,
    maxAttempts,
    backoffMs,
  ]);

  return { consumer: consumerRef.current, partitions, connected };
}

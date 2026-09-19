import { useEffect, useState } from "react";

const PRESENCE_SIGNAL = "presence";
const HEARTBEAT_MS = 20 * 1000;
const STALE_AFTER_MS = 45 * 1000;

// Presence for one record: `ref` is `{ collection, id }`. Uses ephemeral `presence` signals on the
// record's app-data channel; peers are dropped when their heartbeat goes stale.
export default function usePresence(sdk, ref) {
  const [peers, setPeers] = useState([]);

  const collection = ref?.collection;
  const recordId = ref?.id;

  useEffect(() => {
    const identity = sdk?.identity;
    if (!sdk?.signals || !identity || !collection || !recordId) {
      return undefined;
    }

    const channel = `app-data:${sdk.session.appSlug}:${collection}:${recordId}`;
    const peersByIdentity = new Map();

    const publishPeers = () => setPeers([...peersByIdentity.values()].map(({ lastSeenAt, ...peer }) => peer));

    const send = (state) =>
      sdk.signals
        .send(channel, PRESENCE_SIGNAL, {
          state,
          collection,
          id: recordId,
          veripass_identity: identity.veripassIdentity,
          display_name: identity.displayName,
          avatar_url: identity.avatarUrl,
        })
        .catch(() => undefined);

    const unsubscribeChannel = sdk.signals.subscribe(channel);
    const unsubscribe = sdk.signals.listen(PRESENCE_SIGNAL, (payload) => {
      if (payload?.collection !== collection || payload?.id !== recordId) {
        return;
      }
      if (!payload.veripass_identity || payload.veripass_identity === identity.veripassIdentity) {
        return;
      }
      if (payload.state === "leave") {
        peersByIdentity.delete(payload.veripass_identity);
      } else {
        peersByIdentity.set(payload.veripass_identity, {
          veripassIdentity: payload.veripass_identity,
          displayName: payload.display_name,
          avatarUrl: payload.avatar_url,
          lastSeenAt: Date.now(),
        });
      }
      publishPeers();
    });

    send("join");
    const heartbeat = setInterval(() => {
      send("heartbeat");
      const threshold = Date.now() - STALE_AFTER_MS;
      for (const [peerIdentity, peer] of peersByIdentity) {
        if (peer.lastSeenAt < threshold) {
          peersByIdentity.delete(peerIdentity);
        }
      }
      publishPeers();
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
      unsubscribe();
      unsubscribeChannel?.();
      send("leave");
      setPeers([]);
    };
  }, [sdk, collection, recordId]);

  return peers;
}

import WatchConnectivity from '../../modules/watch-connectivity';

/**
 * Bridges the watchOS companion app. Payloads from the watch arrive through a
 * native UserDefaults-backed queue (delivery can happen before JS boots), so
 * every notification triggers a full drain rather than carrying data itself.
 */
export function initWatchSync() {
  if (!WatchConnectivity?.isSupported) {
    return;
  }
  const watch = WatchConnectivity;

  const drain = () => {
    watch
      .consumePendingUserInfo()
      .then((payloads) => payloads.forEach(handleWatchPayload))
      .catch((error) => console.warn('[watchSync] failed to drain watch payloads', error));
  };

  watch.addListener('onUserInfoReceived', drain);
  drain();

  // Phase 0 handshake payload — Phase 1 replaces this with workout templates
  watch
    .updateApplicationContext({
      json: JSON.stringify({ hello: 'from phone', sentAt: new Date().toISOString() }),
    })
    .catch((error) => console.warn('[watchSync] failed to push context', error));
}

function handleWatchPayload(payload: Record<string, unknown>) {
  console.log('[watchSync] received from watch:', payload);
}

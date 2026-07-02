import * as Network from 'expo-network';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * Wire TanStack Query to the platform, per the official React Native setup:
 *
 * - onlineManager follows real connectivity, so offline mutations/queries
 *   pause instead of burning retries, and `refetchOnReconnect` works.
 * - focusManager treats "app returned to foreground" as window focus, so
 *   stale queries refresh when the user comes back to the app.
 *
 * Call once at app startup (root layout module scope).
 */
export function setupReactQueryBindings() {
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected ?? true);
    });
    return () => subscription.remove();
  });

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => subscription.remove();
  });
}

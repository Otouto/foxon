import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

export interface WatchState {
  supported: boolean;
  activationState?: number;
  isPaired?: boolean;
  isWatchAppInstalled?: boolean;
  isReachable?: boolean;
}

type WatchConnectivityEvents = {
  onUserInfoReceived: () => void;
};

declare class WatchConnectivityModule extends NativeModule<WatchConnectivityEvents> {
  isSupported: boolean;
  getState(): Promise<WatchState>;
  updateApplicationContext(context: Record<string, unknown>): Promise<void>;
  transferUserInfo(payload: Record<string, unknown>): Promise<void>;
  consumePendingUserInfo(): Promise<Record<string, unknown>[]>;
}

// Null on Android and in binaries built before the module was added
export default requireOptionalNativeModule<WatchConnectivityModule>('WatchConnectivity');

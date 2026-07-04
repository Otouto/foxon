import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { api } from './client';

const REDIRECT_URL = 'foxon://oura-connected';

/**
 * Runs the full Oura OAuth flow: asks the backend for an authorize URL
 * (sending the device timezone so the server can map session timestamps to
 * local days), opens it in an in-app browser session, and resolves when Oura
 * redirects back to the app scheme. Token exchange happens server-side.
 * Returns true if the account was connected.
 */
async function connectOura(): Promise<boolean> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { url } = await api.get<{ url: string }>(
    `/api/oura/authorize?timezone=${encodeURIComponent(timezone)}`
  );

  const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URL);
  if (result.type !== 'success' || result.url.includes('error')) {
    return false;
  }
  return true;
}

export function useConnectOura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectOura,
    onSuccess: (connected) => {
      if (connected) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    },
  });
}

export function useDisconnectOura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ success: boolean }>('/api/oura'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

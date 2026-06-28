import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {
  Newsreader_500Medium_Italic,
  Newsreader_600SemiBold,
  Newsreader_600SemiBold_Italic,
  useFonts,
} from '@expo-google-fonts/newsreader';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { registerTokenGetter } from '@/api/client';
import { CACHE_BUSTER, mmkvPersister } from '@/api/persister';
import { queryClient } from '@/api/queryClient';
import { PrefetchOnAuth } from '@/components/PrefetchOnAuth';
import { colors } from '@/theme';

const ONE_DAY = 1000 * 60 * 60 * 24;

/** Bridges Clerk's getToken into the plain-module API client. */
function ApiAuthBinding() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    registerTokenGetter(isSignedIn ? () => getToken() : null);
    return () => registerTokenGetter(null);
  }, [getToken, isSignedIn]);

  return null;
}

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null; // splash screen stays visible until auth state is known
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="profile"
          options={{ headerShown: true, title: 'Profile', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="session/log"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="session/finish" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)/sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_500Medium_Italic,
    Newsreader_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });

  if (!fontsLoaded) {
    return null; // keep the splash up until the editorial serif is ready
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: mmkvPersister, maxAge: ONE_DAY, buster: CACHE_BUSTER }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ApiAuthBinding />
          <PrefetchOnAuth />
          <RootNavigator />
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    </ClerkProvider>
  );
}

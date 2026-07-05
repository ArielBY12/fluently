/**
 * Root navigation. A Stack containing the tab group and the full-screen flows
 * (onboarding, lesson runner, results, paywall). We wait for the persisted game
 * state to hydrate from AsyncStorage before rendering, so the onboarding gate
 * and stats are correct on first paint.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useGameStore } from '@/store/gameStore';
import { theme } from '@/theme';

export default function RootLayout() {
  const hydrated = useGameStore((s) => s._hasHydrated);
  const ensureDailyReset = useGameStore((s) => s.ensureDailyReset);

  useEffect(() => {
    if (hydrated) ensureDailyReset();
  }, [hydrated, ensureDailyReset]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {!hydrated ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="lesson/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="results" options={{ gestureEnabled: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme, View } from 'react-native';
import { LibraryProvider } from '../src/context/LibraryContext';
import { PlayerProvider } from '../src/context/PlayerContext';
import { palette } from '../src/theme/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'light' ? palette.light : palette.dark;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.background }}>
      <SafeAreaProvider>
        <LibraryProvider>
          <PlayerProvider>
            <View style={{ flex: 1, backgroundColor: c.background }}>
              <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: c.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="player"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen name="playlist/[id]" />
              </Stack>
            </View>
          </PlayerProvider>
        </LibraryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

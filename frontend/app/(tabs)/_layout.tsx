import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform } from 'react-native';
import { useTheme } from '../../src/theme/theme';
import { MiniPlayer } from '../../src/components/MiniPlayer';

export default function TabsLayout() {
  const c = useTheme();
  const tabBarHeight = Platform.OS === 'ios' ? 84 : 68;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.textSecondary,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: tabBarHeight,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={70}
              tint={c.isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: c.isDark ? 'rgba(10,10,10,0.75)' : 'rgba(247,247,245,0.85)',
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.border,
                },
              ]}
            />
          ),
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'library' : 'library-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer bottomOffset={tabBarHeight} />
    </View>
  );
}

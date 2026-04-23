import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useTheme, radius, spacing } from '../theme/theme';
import { usePlayer } from '../context/PlayerContext';
import { AlbumArt } from './AlbumArt';

export const MiniPlayer = ({ bottomOffset = 0 }: { bottomOffset?: number }) => {
  const c = useTheme();
  const { current, isPlaying, togglePlay, positionMs, durationMs } = usePlayer();
  if (!current) return null;

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <View
      style={[
        styles.wrap,
        { bottom: bottomOffset + spacing.sm },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={60}
        tint={c.isDark ? 'dark' : 'light'}
        style={[
          styles.pill,
          {
            borderColor: c.glassBorder,
            backgroundColor: c.isDark ? 'rgba(28,28,28,0.75)' : 'rgba(255,255,255,0.85)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.inner}
          activeOpacity={0.9}
          onPress={() => router.push('/player')}
          testID="mini-player"
        >
          <AlbumArt id={current.id} title={current.title} size={40} radius={radius.sm} artwork={current.artwork} />
          <View style={styles.meta}>
            <Text numberOfLines={1} style={[styles.title, { color: c.textPrimary }]}>{current.title}</Text>
            <Text numberOfLines={1} style={[styles.artist, { color: c.textSecondary }]}>{current.artist}</Text>
          </View>
          <TouchableOpacity
            onPress={togglePlay}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.playBtn, { backgroundColor: c.primary }]}
            testID="mini-player-toggle"
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#0A0A0A" />
          </TouchableOpacity>
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: c.primary }]} />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  pill: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  meta: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  artist: { fontSize: 12, marginTop: 1 },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
});

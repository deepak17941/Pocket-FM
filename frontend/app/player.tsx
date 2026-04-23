import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../src/theme/theme';
import { usePlayer } from '../src/context/PlayerContext';
import { useLibrary } from '../src/context/LibraryContext';
import { AlbumArt } from '../src/components/AlbumArt';
import { formatMs } from '../src/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

export default function PlayerScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { current, isPlaying, togglePlay, seekTo, next, previous, positionMs, durationMs } = usePlayer();
  const { favorites, toggleFavorite } = useLibrary();
  const [seekBarWidth, setSeekBarWidth] = useState(SCREEN_W - spacing.lg * 2);

  if (!current) {
    return (
      <View style={[styles.root, { backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: c.textSecondary }}>No track playing</Text>
      </View>
    );
  }

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const isFav = favorites.includes(current.id);
  const artSize = Math.min(SCREEN_W - spacing.lg * 2, 380);

  const onSeekTap = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / seekBarWidth));
    if (durationMs > 0) seekTo(pct * durationMs);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          testID="player-close"
        >
          <Ionicons name="chevron-down" size={22} color={c.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: c.textTertiary }]}>NOW PLAYING</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(current.id)}
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          testID="player-favorite"
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? c.primary : c.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Album art */}
      <View style={styles.artWrap}>
        <AlbumArt
          id={current.id}
          title={current.title}
          size={artSize}
          radius={radius.xxl}
          iconSize={artSize * 0.3}
        />
      </View>

      {/* Title / Artist */}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{current.title}</Text>
        <Text style={[styles.artist, { color: c.textSecondary }]} numberOfLines={1}>{current.artist}</Text>
      </View>

      {/* Seek bar */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Pressable
          onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
          onPress={onSeekTap}
          hitSlop={{ top: 16, bottom: 16, left: 0, right: 0 }}
          testID="player-seekbar"
        >
          <View style={[styles.seekTrack, { backgroundColor: c.surfaceSecondary }]}>
            <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: c.primary }]} />
            <View
              style={[
                styles.seekThumb,
                {
                  left: `${progress * 100}%`,
                  backgroundColor: c.primary,
                  borderColor: c.background,
                },
              ]}
            />
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: c.textSecondary }]}>{formatMs(positionMs)}</Text>
          <Text style={[styles.timeText, { color: c.textSecondary }]}>{formatMs(durationMs)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity onPress={previous} style={styles.sideBtn} testID="player-prev">
          <Ionicons name="play-skip-back" size={36} color={c.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={togglePlay}
          style={[styles.playBtn, { backgroundColor: c.primary }]}
          testID="player-toggle"
          activeOpacity={0.85}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={36}
            color="#fff"
            style={{ marginLeft: isPlaying ? 0 : 4 }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.sideBtn} testID="player-next">
          <Ionicons name="play-skip-forward" size={36} color={c.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  artWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  titleWrap: { paddingHorizontal: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  artist: { fontSize: 16, marginTop: 6, fontWeight: '500' },
  seekTrack: {
    marginTop: spacing.xl,
    height: 4, borderRadius: 2, position: 'relative',
    overflow: 'visible',
  },
  seekFill: { height: 4, borderRadius: 2 },
  seekThumb: {
    position: 'absolute',
    top: -6, width: 16, height: 16, borderRadius: 8,
    marginLeft: -8,
    borderWidth: 3,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { fontSize: 12, fontWeight: '600' },
  controls: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xl,
  },
  sideBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4500', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});

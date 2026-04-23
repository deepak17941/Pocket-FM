import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../src/theme/theme';
import { usePlayer } from '../src/context/PlayerContext';
import { useLibrary } from '../src/context/LibraryContext';
import { AlbumArt } from '../src/components/AlbumArt';
import { formatMs, colorFromId } from '../src/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

export default function PlayerScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const {
    current, isPlaying, togglePlay, seekTo, next, previous, positionMs, durationMs,
    shuffle, toggleShuffle, repeat, cycleRepeat,
  } = usePlayer();
  const { favorites, toggleFavorite } = useLibrary();
  const [seekBarWidth, setSeekBarWidth] = useState(SCREEN_W - spacing.lg * 2);
  const pulse = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [isPlaying, pulse]);

  if (!current) {
    return (
      <View style={[styles.root, { backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: c.textSecondary }}>No track playing</Text>
      </View>
    );
  }

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const isFav = favorites.includes(current.id);
  const artSize = Math.min(SCREEN_W - spacing.lg * 2, 360);
  const trackGlow = colorFromId(current.id);

  const onSeekTap = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / seekBarWidth));
    if (durationMs > 0) seekTo(pct * durationMs);
  };

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  const repeatIcon: keyof typeof Ionicons.glyphMap =
    repeat === 'one' ? 'repeat-outline' : 'repeat-outline';

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Ambient glow derived from track color */}
      <View pointerEvents="none" style={[styles.ambientGlow, { backgroundColor: trackGlow, top: insets.top + 40 }]} />
      <View pointerEvents="none" style={[styles.ambientGlow2, { backgroundColor: c.primary }]} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          testID="player-close"
        >
          <Ionicons name="chevron-down" size={22} color={c.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitle}>
          <Text style={[styles.eyebrow, { color: c.textTertiary }]}>PLAYING FROM LIBRARY</Text>
          <Text numberOfLines={1} style={[styles.topTrackName, { color: c.textPrimary }]}>{current.title}</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          testID="player-more"
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Album art with soft color shadow */}
      <View style={styles.artWrap}>
        <View
          style={[
            styles.artShadow,
            {
              width: artSize * 0.92,
              height: artSize * 0.92,
              backgroundColor: trackGlow,
              bottom: -artSize * 0.06,
            },
          ]}
        />
        <AlbumArt
          id={current.id}
          title={current.title}
          size={artSize}
          radius={radius.xl}
          iconSize={artSize * 0.3}
        />
      </View>

      {/* Title + artist + favorite */}
      <View style={styles.meta}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{current.title}</Text>
          <Text style={[styles.artist, { color: c.textSecondary }]} numberOfLines={1}>{current.artist}</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(current.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="player-favorite"
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={30} color={isFav ? c.primary : c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Seek bar */}
      <View style={styles.seekWrap}>
        <Pressable
          onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
          onPress={onSeekTap}
          hitSlop={{ top: 20, bottom: 20, left: 0, right: 0 }}
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
          <Text style={[styles.timeText, { color: c.textSecondary }]}>
            -{formatMs(Math.max(0, durationMs - positionMs))}
          </Text>
        </View>
      </View>

      {/* Controls row */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity onPress={toggleShuffle} style={styles.sideBtn} testID="player-shuffle">
          <Ionicons name="shuffle" size={24} color={shuffle ? c.primary : c.textSecondary} />
          {shuffle && <View style={[styles.activeDot, { backgroundColor: c.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={previous} style={styles.sideBtnMain} testID="player-prev">
          <Ionicons name="play-skip-back" size={32} color={c.textPrimary} />
        </TouchableOpacity>

        <View style={styles.playWrap}>
          <Animated.View
            style={[
              styles.playGlow,
              {
                backgroundColor: c.primary,
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
            pointerEvents="none"
          />
          <TouchableOpacity
            onPress={togglePlay}
            style={[styles.playBtn, { backgroundColor: c.primary }]}
            testID="player-toggle"
            activeOpacity={0.9}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={34}
              color="#000"
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={next} style={styles.sideBtnMain} testID="player-next">
          <Ionicons name="play-skip-forward" size={32} color={c.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={cycleRepeat} style={styles.sideBtn} testID="player-repeat">
          <Ionicons
            name={repeat === 'one' ? 'repeat' : 'repeat'}
            size={24}
            color={repeat !== 'off' ? c.primary : c.textSecondary}
          />
          {repeat === 'one' ? (
            <Text style={[styles.repeatOne, { color: c.primary }]}>1</Text>
          ) : repeat === 'all' ? (
            <View style={[styles.activeDot, { backgroundColor: c.primary }]} />
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  ambientGlow: {
    position: 'absolute',
    width: 420, height: 420, borderRadius: 210,
    alignSelf: 'center', opacity: 0.22,
  },
  ambientGlow2: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    right: -100, bottom: -80, opacity: 0.08,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md,
  },
  topTitle: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  topTrackName: { fontSize: 13, fontWeight: '700', marginTop: 2, maxWidth: '90%' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  artWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  artShadow: {
    position: 'absolute',
    borderRadius: radius.xxl,
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  meta: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1.0 },
  artist: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  seekWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  seekTrack: {
    height: 4, borderRadius: 2, position: 'relative',
    overflow: 'visible',
  },
  seekFill: { height: 4, borderRadius: 2 },
  seekThumb: {
    position: 'absolute',
    top: -7, width: 18, height: 18, borderRadius: 9,
    marginLeft: -9,
    borderWidth: 3,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  controls: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sideBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  sideBtnMain: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  playWrap: {
    width: 88, height: 88, alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  playGlow: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    zIndex: 1,
  },
  activeDot: {
    position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2,
  },
  repeatOne: {
    position: 'absolute', top: -2, right: 6,
    fontSize: 10, fontWeight: '900',
  },
});

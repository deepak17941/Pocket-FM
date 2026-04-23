import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../store/types';
import { useTheme, radius, spacing } from '../theme/theme';
import { AlbumArt } from './AlbumArt';
import { formatDuration } from '../utils/format';

type Props = {
  track: Track;
  onPress: () => void;
  onMore?: () => void;
  isPlaying?: boolean;
  isFavorite?: boolean;
};

export const TrackItem = ({ track, onPress, onMore, isPlaying, isFavorite }: Props) => {
  const c = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.row, { backgroundColor: 'transparent' }]}
      testID={`track-item-${track.id}`}
    >
      <AlbumArt id={track.id} title={track.title} size={56} radius={radius.md} artwork={track.artwork} />
      <View style={styles.meta}>
        <Text numberOfLines={1} style={[styles.title, { color: isPlaying ? c.primary : c.textPrimary }]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: c.textSecondary }]}>
          {track.artist} · {formatDuration(track.duration)}
        </Text>
      </View>
      {isFavorite ? (
        <Ionicons name="heart" size={18} color={c.primary} style={{ marginRight: spacing.sm }} />
      ) : null}
      {onMore ? (
        <TouchableOpacity
          onPress={onMore}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID={`track-more-${track.id}`}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={c.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    minHeight: 72,
  },
  meta: { flex: 1, marginLeft: spacing.md },
  title: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  artist: { fontSize: 13, marginTop: 2 },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { useLibrary } from '../../src/context/LibraryContext';
import { usePlayer } from '../../src/context/PlayerContext';
import { TrackItem } from '../../src/components/TrackItem';
import { AlbumArt } from '../../src/components/AlbumArt';
import { EmptyState } from '../../src/components/EmptyState';

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { playlists, getTrackById, removeTrackFromPlaylist, favorites } = useLibrary();
  const { playTrack, current } = usePlayer();

  const pl = playlists.find((p) => p.id === id);
  if (!pl) {
    return (
      <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={c.textPrimary} />
        </TouchableOpacity>
        <EmptyState icon="alert-circle-outline" title="Playlist not found" />
      </View>
    );
  }

  const tracks = pl.trackIds.map((tid) => getTrackById(tid)).filter(Boolean) as NonNullable<ReturnType<typeof getTrackById>>[];
  const firstTrack = tracks[0];

  const playAll = () => {
    if (tracks.length > 0) playTrack(tracks[0], tracks);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          onPress={() => router.back()}
          testID="playlist-back"
        >
          <Ionicons name="chevron-back" size={22} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <AlbumArt id={pl.id} title={firstTrack?.title ?? pl.name} size={160} radius={radius.xl} />
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>PLAYLIST</Text>
        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{pl.name}</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
        </Text>
        {tracks.length > 0 && (
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: c.primary }]}
            onPress={playAll}
            testID="playlist-play-all"
          >
            <Ionicons name="play" size={20} color="#0A0A0A" />
            <Text style={styles.playBtnText}>Play</Text>
          </TouchableOpacity>
        )}
      </View>

      {tracks.length === 0 ? (
        <EmptyState
          icon="musical-notes-outline"
          title="Empty playlist"
          subtitle="Add tracks from your library using the ellipsis menu."
        />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => playTrack(item, tracks)}
              onMore={() => removeTrackFromPlaylist(pl.id, item.id)}
              isPlaying={current?.id === item.id}
              isFavorite={favorites.includes(item.id)}
            />
          )}
          testID="playlist-tracks-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: spacing.md },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: spacing.md },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 6, textAlign: 'center' },
  sub: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, marginTop: spacing.md,
  },
  playBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
});

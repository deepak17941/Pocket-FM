import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../src/theme/theme';
import { useLibrary } from '../../src/context/LibraryContext';
import { usePlayer } from '../../src/context/PlayerContext';
import { TrackItem } from '../../src/components/TrackItem';
import { EmptyState } from '../../src/components/EmptyState';

export default function FavoritesScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { tracks, favorites, toggleFavorite } = useLibrary();
  const { playTrack, current } = usePlayer();

  const favTracks = tracks.filter((t) => favorites.includes(t.id));

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>LOVED TRACKS</Text>
        <Text style={[styles.h1, { color: c.textPrimary }]}>Favorites</Text>
      </View>

      {favTracks.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favorites yet"
          subtitle="Tap the heart on any track to add it here."
          testID="favorites-empty"
        />
      ) : (
        <FlatList
          data={favTracks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => playTrack(item, favTracks)}
              onMore={() => toggleFavorite(item.id)}
              isPlaying={current?.id === item.id}
              isFavorite
            />
          )}
          testID="favorites-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
});

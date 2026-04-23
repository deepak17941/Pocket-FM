import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { TrackItem } from '../../src/components/TrackItem';
import { EmptyState } from '../../src/components/EmptyState';
import { useLibrary } from '../../src/context/LibraryContext';
import { usePlayer } from '../../src/context/PlayerContext';
import { pickAudioFiles } from '../../src/utils/picker';
import { Track } from '../../src/store/types';

type SortKey = 'recent' | 'oldest' | 'titleAsc' | 'titleDesc' | 'artistAsc';
const SORT_OPTIONS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'recent',    label: 'Recently added',   icon: 'time-outline' },
  { key: 'oldest',    label: 'Oldest first',     icon: 'hourglass-outline' },
  { key: 'titleAsc',  label: 'Title · A to Z',   icon: 'arrow-down-outline' },
  { key: 'titleDesc', label: 'Title · Z to A',   icon: 'arrow-up-outline' },
  { key: 'artistAsc', label: 'Artist · A to Z',  icon: 'person-outline' },
];
const SORT_KEY = '@pfm/librarySort';

export default function LibraryScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { tracks, playlists, favorites, toggleFavorite, removeTrack, addTracks, addTrackToPlaylist } = useLibrary();
  const { playTrack, current } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [plPickerFor, setPlPickerFor] = useState<Track | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortPickerOpen, setSortPickerOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SORT_KEY).then((v) => {
      if (v && SORT_OPTIONS.some((o) => o.key === v)) setSort(v as SortKey);
    });
  }, []);

  const pickSort = (k: SortKey) => {
    setSort(k);
    AsyncStorage.setItem(SORT_KEY, k).catch(() => {});
    setSortPickerOpen(false);
  };

  const handleAdd = async () => {
    try {
      setLoading(true);
      const newTracks = await pickAudioFiles();
      if (newTracks.length > 0) addTracks(newTracks);
    } catch (e: any) {
      Alert.alert('Could not add music', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (track: Track) => {
    setMenuTrack(null);
    Alert.alert('Remove track', `Remove "${track.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeTrack(track.id) },
    ]);
  };

  const sorted = [...tracks].sort((a, b) => {
    switch (sort) {
      case 'oldest':    return a.addedAt - b.addedAt;
      case 'titleAsc':  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'titleDesc': return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      case 'artistAsc': return a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
                               || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'recent':
      default:          return b.addedAt - a.addedAt;
    }
  });
  const currentSort = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0];

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: c.textSecondary }]}>YOUR LIBRARY</Text>
          <Text style={[styles.h1, { color: c.textPrimary }]}>Pocket FM</Text>
        </View>
        <TouchableOpacity
          style={[styles.addHeaderBtn, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
          onPress={handleAdd}
          testID="header-add-button"
        >
          <Ionicons name="add" size={22} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      {tracks.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={[styles.countText, { color: c.textSecondary }]}>
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </Text>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
            onPress={() => setSortPickerOpen(true)}
            testID="library-sort-btn"
          >
            <Ionicons name={currentSort.icon} size={14} color={c.textPrimary} />
            <Text style={[styles.sortBtnText, { color: c.textPrimary }]} numberOfLines={1}>{currentSort.label}</Text>
            <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon="musical-notes-outline"
          title="No music yet"
          subtitle="Add audio files from your device to start listening offline."
          testID="library-empty"
          action={
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: c.primary }]}
              onPress={handleAdd}
              disabled={loading}
              testID="empty-add-button"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#0A0A0A" />
                  <Text style={styles.primaryBtnText}>Add music</Text>
                </>
              )}
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => playTrack(item, sorted)}
              onMore={() => setMenuTrack(item)}
              isPlaying={current?.id === item.id}
              isFavorite={favorites.includes(item.id)}
            />
          )}
          testID="library-list"
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.primary, bottom: insets.bottom + 92 }]}
        onPress={handleAdd}
        disabled={loading}
        activeOpacity={0.85}
        testID="fab-add-button"
      >
        {loading ? <ActivityIndicator color="#0A0A0A" /> : <Ionicons name="add" size={30} color="#0A0A0A" />}
      </TouchableOpacity>

      {/* Track actions sheet */}
      <Modal visible={!!menuTrack} transparent animationType="fade" onRequestClose={() => setMenuTrack(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuTrack(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: c.textPrimary }]} numberOfLines={1}>{menuTrack?.title}</Text>
            <SheetButton icon={favorites.includes(menuTrack?.id ?? '') ? 'heart' : 'heart-outline'} label={favorites.includes(menuTrack?.id ?? '') ? 'Remove from favorites' : 'Add to favorites'} onPress={() => { if (menuTrack) toggleFavorite(menuTrack.id); setMenuTrack(null); }} color={c.textPrimary} />
            <SheetButton icon="list-outline" label="Add to playlist" onPress={() => { setPlPickerFor(menuTrack); setMenuTrack(null); }} color={c.textPrimary} disabled={playlists.length === 0} subLabel={playlists.length === 0 ? 'Create a playlist first' : undefined} subColor={c.textTertiary} />
            <SheetButton icon="trash-outline" label="Remove from library" onPress={() => menuTrack && confirmDelete(menuTrack)} color="#E54D2E" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Playlist picker sheet */}
      <Modal visible={!!plPickerFor} transparent animationType="fade" onRequestClose={() => setPlPickerFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPlPickerFor(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: c.textPrimary }]}>Add to playlist</Text>
            {playlists.map((p) => (
              <SheetButton key={p.id} icon="list" label={p.name} subLabel={`${p.trackIds.length} tracks`} subColor={c.textTertiary} color={c.textPrimary} onPress={() => { if (plPickerFor) addTrackToPlaylist(p.id, plPickerFor.id); setPlPickerFor(null); }} />
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort picker sheet */}
      <Modal visible={sortPickerOpen} transparent animationType="fade" onRequestClose={() => setSortPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortPickerOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: c.textPrimary }]}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => {
              const selected = opt.key === sort;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.sheetBtn}
                  onPress={() => pickSort(opt.key)}
                  testID={`sort-option-${opt.key}`}
                >
                  <Ionicons name={opt.icon} size={22} color={selected ? c.primary : c.textPrimary} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: selected ? c.primary : c.textPrimary, fontSize: 16, fontWeight: selected ? '800' : '600' }}>
                      {opt.label}
                    </Text>
                  </View>
                  {selected && <Ionicons name="checkmark" size={22} color={c.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetButton({ icon, label, onPress, color, subLabel, subColor, disabled }: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.sheetBtn, disabled && { opacity: 0.4 }]} testID={`sheet-btn-${label}`}>
      <Ionicons name={icon} size={22} color={color} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        {subLabel ? <Text style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{subLabel}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  addHeaderBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  countText: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  sortRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, maxWidth: 200,
  },
  sortBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, gap: 8,
  },
  primaryBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
  fab: {
    position: 'absolute', right: spacing.lg,
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    padding: spacing.md, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xxl,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md, paddingHorizontal: spacing.sm },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.sm, borderRadius: radius.md,
  },
});

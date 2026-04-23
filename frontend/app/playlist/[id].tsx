import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Pressable } from 'react-native';
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
  const { tracks, playlists, getTrackById, removeTrackFromPlaylist, addTrackToPlaylist, favorites } = useLibrary();
  const { playTrack, current } = usePlayer();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const plTracks = pl.trackIds.map((tid) => getTrackById(tid)).filter(Boolean) as NonNullable<ReturnType<typeof getTrackById>>[];
  const firstTrack = plTracks[0];
  const candidates = tracks.filter((t) => !pl.trackIds.includes(t.id));

  const playAll = () => { if (plTracks.length > 0) playTrack(plTracks[0], plTracks); };

  const openPicker = () => { setSelected(new Set()); setPicking(true); };
  const toggle = (tid: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(tid) ? n.delete(tid) : n.add(tid); return n; });
  };
  const confirmAdd = () => {
    selected.forEach((tid) => addTrackToPlaylist(pl.id, tid));
    setPicking(false);
    setSelected(new Set());
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
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surfaceSecondary }]}
          onPress={openPicker}
          disabled={candidates.length === 0}
          testID="playlist-add-songs-btn"
        >
          <Ionicons name="add" size={24} color={candidates.length === 0 ? c.textTertiary : c.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <AlbumArt id={pl.id} title={firstTrack?.title ?? pl.name} size={160} radius={radius.xl} artwork={firstTrack?.artwork} />
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>PLAYLIST</Text>
        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{pl.name}</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>
          {plTracks.length} {plTracks.length === 1 ? 'track' : 'tracks'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
          {plTracks.length > 0 && (
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: c.primary }]} onPress={playAll} testID="playlist-play-all">
              <Ionicons name="play" size={20} color="#0A0A0A" />
              <Text style={styles.playBtnText}>Play</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: c.surfaceSecondary }]} onPress={openPicker} disabled={candidates.length === 0} testID="playlist-add-cta">
            <Ionicons name="add" size={18} color={candidates.length === 0 ? c.textTertiary : c.textPrimary} />
            <Text style={{ color: candidates.length === 0 ? c.textTertiary : c.textPrimary, fontWeight: '700', fontSize: 14 }}>Add songs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {plTracks.length === 0 ? (
        <EmptyState
          icon="musical-notes-outline"
          title="Empty playlist"
          subtitle={candidates.length === 0 ? 'Add music to your library first, then come back here.' : 'Tap "Add songs" to fill this playlist.'}
        />
      ) : (
        <FlatList
          data={plTracks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => playTrack(item, plTracks)}
              onMore={() => removeTrackFromPlaylist(pl.id, item.id)}
              isPlaying={current?.id === item.id}
              isFavorite={favorites.includes(item.id)}
            />
          )}
          testID="playlist-tracks-list"
        />
      )}

      {/* Add-songs picker */}
      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)} presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={[styles.pickerHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setPicking(false)} testID="picker-cancel">
              <Text style={{ color: c.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: c.textPrimary }]}>Add songs</Text>
            <TouchableOpacity onPress={confirmAdd} disabled={selected.size === 0} testID="picker-confirm">
              <Text style={{ color: selected.size === 0 ? c.textTertiary : c.primary, fontSize: 16, fontWeight: '800' }}>
                Add{selected.size > 0 ? ` (${selected.size})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
          {candidates.length === 0 ? (
            <EmptyState icon="musical-notes-outline" title="All your songs are already in this playlist" />
          ) : (
            <FlatList
              data={candidates}
              keyExtractor={(t) => t.id}
              contentContainerStyle={{ paddingVertical: spacing.sm }}
              renderItem={({ item }) => {
                const picked = selected.has(item.id);
                return (
                  <TouchableOpacity
                    style={styles.pickRow}
                    activeOpacity={0.7}
                    onPress={() => toggle(item.id)}
                    testID={`picker-item-${item.id}`}
                  >
                    <AlbumArt id={item.id} title={item.title} size={48} radius={radius.md} artwork={item.artwork} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text numberOfLines={1} style={{ color: c.textPrimary, fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
                      <Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{item.artist}</Text>
                    </View>
                    <View style={[styles.checkbox, { borderColor: picked ? c.primary : c.border, backgroundColor: picked ? c.primary : 'transparent' }]}>
                      {picked && <Ionicons name="checkmark" size={16} color="#0A0A0A" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: spacing.md },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: spacing.md },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginTop: 6, textAlign: 'center' },
  sub: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999,
  },
  playBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 17, fontWeight: '800' },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 10 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});

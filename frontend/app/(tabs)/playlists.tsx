import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { useLibrary } from '../../src/context/LibraryContext';
import { EmptyState } from '../../src/components/EmptyState';
import { AlbumArt } from '../../src/components/AlbumArt';

export default function PlaylistsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist, deletePlaylist, getTrackById } = useLibrary();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const onCreate = () => {
    if (!name.trim()) return;
    createPlaylist(name.trim());
    setName('');
    setCreating(false);
  };

  const onLongPress = (id: string, pname: string) => {
    Alert.alert('Delete playlist', `Delete "${pname}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(id) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: c.textSecondary }]}>CURATED</Text>
          <Text style={[styles.h1, { color: c.textPrimary }]}>Playlists</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => setCreating(true)}
          testID="create-playlist-button"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="No playlists yet"
          subtitle="Group your tracks into playlists for easier access."
          testID="playlists-empty"
          action={
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={() => setCreating(true)} testID="empty-create-playlist">
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Create playlist</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}
          renderItem={({ item }) => {
            const firstTrack = item.trackIds.length > 0 ? getTrackById(item.trackIds[0]) : null;
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push(`/playlist/${item.id}`)}
                onLongPress={() => onLongPress(item.id, item.name)}
                style={[styles.row, { backgroundColor: c.surfaceSecondary }]}
                testID={`playlist-${item.id}`}
              >
                <AlbumArt id={item.id} title={firstTrack?.title ?? item.name} size={56} radius={radius.md} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[styles.rowTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.rowSub, { color: c.textSecondary }]}>
                    {item.trackIds.length} {item.trackIds.length === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.textTertiary} />
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}

      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCreating(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: c.textPrimary }]}>New playlist</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor={c.textTertiary}
              autoFocus
              style={[styles.input, { backgroundColor: c.surfaceSecondary, color: c.textPrimary, borderColor: c.border }]}
              onSubmitEditing={onCreate}
              testID="playlist-name-input"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.md }}>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: c.surfaceSecondary }]} onPress={() => { setCreating(false); setName(''); }}>
                <Text style={{ color: c.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary, flex: 1 }]} onPress={onCreate} testID="confirm-create-playlist">
                <Text style={styles.primaryBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.lg,
  },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 13, marginTop: 2 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  sheet: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: spacing.md },
  input: {
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 16,
  },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { AlbumArt } from '../../src/components/AlbumArt';
import { useLibrary } from '../../src/context/LibraryContext';
import { searchOnline, downloadToLibrary, SearchHit } from '../../src/utils/online';
import { formatDuration } from '../../src/utils/format';

export default function SearchScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { addTracks, tracks } = useLibrary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const reqIdRef = useRef(0);

  const existingUris = new Set(tracks.map((t) => t.uri));
  const existingByRemote = new Set(tracks.map((t) => (t as any).remoteUrl).filter(Boolean));

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const rid = ++reqIdRef.current;
    setLoading(true);
    try {
      const r = await searchOnline(q);
      if (rid === reqIdRef.current) setResults(r);
    } catch (e: any) {
      if (rid === reqIdRef.current) Alert.alert('Search failed', e?.message ?? 'Try again.');
    } finally {
      if (rid === reqIdRef.current) setLoading(false);
    }
  };

  const onAdd = async (hit: SearchHit) => {
    if (downloading.has(hit.id)) return;
    setDownloading((prev) => new Set(prev).add(hit.id));
    try {
      const track = await downloadToLibrary(hit);
      addTracks([track]);
      Alert.alert('Added', `"${hit.title}" saved to your library.`);
    } catch (e: any) {
      Alert.alert('Download failed', e?.message ?? 'Unable to download.');
    } finally {
      setDownloading((prev) => {
        const n = new Set(prev); n.delete(hit.id); return n;
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>INTERNET ARCHIVE</Text>
        <Text style={[styles.h1, { color: c.textPrimary }]}>Discover</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}>
        <Ionicons name="search" size={20} color={c.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search free music, podcasts, audiobooks…"
          placeholderTextColor={c.textTertiary}
          returnKeyType="search"
          onSubmitEditing={runSearch}
          style={[styles.searchInput, { color: c.textPrimary }]}
          testID="search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color={c.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.primary} />
          <Text style={{ color: c.textSecondary, marginTop: spacing.sm, fontSize: 13 }}>Searching Internet Archive…</Text>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={query.length > 0 ? 'Hit search to begin' : 'Find free music'}
          subtitle="Search the Internet Archive for public-domain and Creative-Commons tracks. Tap the + to save any to your offline library."
          testID="search-empty"
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(h) => h.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
          renderItem={({ item }) => {
            const isDown = downloading.has(item.id);
            const alreadyAdded = existingUris.has(item.audio_url) || existingByRemote.has(item.audio_url);
            return (
              <View style={styles.row} testID={`search-result-${item.id}`}>
                <AlbumArt id={item.id} title={item.title} size={52} radius={radius.md} />
                <View style={styles.meta}>
                  <Text numberOfLines={1} style={[styles.title, { color: c.textPrimary }]}>{item.title}</Text>
                  <Text numberOfLines={1} style={[styles.artist, { color: c.textSecondary }]}>
                    {item.creator}{item.duration > 0 ? ` · ${formatDuration(item.duration)}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onAdd(item)}
                  disabled={isDown || alreadyAdded}
                  style={[
                    styles.addBtn,
                    { backgroundColor: alreadyAdded ? c.surfaceSecondary : c.primary },
                    (isDown) && { opacity: 0.7 },
                  ]}
                  testID={`search-add-${item.id}`}
                >
                  {isDown ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : alreadyAdded ? (
                    <Ionicons name="checkmark" size={20} color={c.textPrimary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
          testID="search-results"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: spacing.lg, gap: spacing.md,
  },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  artist: { fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});

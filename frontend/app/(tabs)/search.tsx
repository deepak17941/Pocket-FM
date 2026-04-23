import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { AlbumArt } from '../../src/components/AlbumArt';
import { useLibrary } from '../../src/context/LibraryContext';
import { searchOnline, downloadToLibrary, checkUrl, SearchHit } from '../../src/utils/online';
import { formatDuration } from '../../src/utils/format';

type Mode = 'search' | 'url';

export default function DiscoverScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { addTracks, tracks } = useLibrary();
  const [mode, setMode] = useState<Mode>('search');

  // search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const reqIdRef = useRef(0);

  // url-paste state
  const [urlInput, setUrlInput] = useState('');
  const [checkingUrl, setCheckingUrl] = useState(false);

  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const existingUris = new Set(tracks.map((t) => t.uri));

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    const rid = ++reqIdRef.current;
    setSearching(true);
    setHasSearched(true);
    try {
      const r = await searchOnline(q);
      if (rid === reqIdRef.current) setResults(r);
    } catch (e: any) {
      if (rid === reqIdRef.current) Alert.alert('Search failed', e?.message ?? 'Try again.');
    } finally {
      if (rid === reqIdRef.current) setSearching(false);
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

  const onUrlAdd = async () => {
    const u = urlInput.trim();
    if (!u) return;
    setCheckingUrl(true);
    try {
      const meta = await checkUrl(u);
      const hit: SearchHit = {
        id: `url_${Date.now()}`,
        title: meta.title,
        creator: meta.artist,
        audio_url: meta.audio_url,
        duration: meta.duration,
      };
      const track = await downloadToLibrary(hit);
      addTracks([track]);
      Alert.alert('Added', `"${meta.title}" saved to your library.`);
      setUrlInput('');
    } catch (e: any) {
      Alert.alert('Could not add URL', e?.message ?? 'Make sure it is a direct audio link.');
    } finally {
      setCheckingUrl(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>DISCOVER</Text>
        <Text style={[styles.h1, { color: c.textPrimary }]}>Find music</Text>
      </View>

      {/* Segmented control */}
      <View style={[styles.segment, { backgroundColor: c.surfaceSecondary }]}>
        <SegmentBtn
          label="Search"
          icon="search"
          active={mode === 'search'}
          onPress={() => setMode('search')}
          c={c}
          testID="mode-search"
        />
        <SegmentBtn
          label="Paste URL"
          icon="link"
          active={mode === 'url'}
          onPress={() => setMode('url')}
          c={c}
          testID="mode-url"
        />
      </View>

      {mode === 'search' ? (
        <>
          <View style={[styles.searchBar, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}>
            <Ionicons name="search" size={20} color={c.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search artists, tracks, moods…"
              placeholderTextColor={c.textTertiary}
              returnKeyType="search"
              onSubmitEditing={runSearch}
              style={[styles.searchInput, { color: c.textPrimary }]}
              testID="search-input"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
                <Ionicons name="close-circle" size={20} color={c.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {searching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ color: c.textSecondary, marginTop: spacing.sm, fontSize: 13 }}>Searching Audius…</Text>
            </View>
          ) : results.length === 0 ? (
            <EmptyState
              icon={hasSearched ? 'sad-outline' : 'search-outline'}
              title={hasSearched ? 'No results' : 'Search Audius'}
              subtitle={
                hasSearched
                  ? 'Try a different artist or song name.'
                  : 'Search the Audius catalogue — indie, hip-hop, electronic, ambient, and more. Tap + to save any track offline.'
              }
              testID="search-empty"
            />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(h) => h.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 200, paddingTop: spacing.sm }}
              renderItem={({ item }) => (
                <ResultRow
                  hit={item}
                  c={c}
                  downloading={downloading.has(item.id)}
                  added={existingUris.has(item.audio_url)}
                  onAdd={() => onAdd(item)}
                />
              )}
              testID="search-results"
            />
          )}
        </>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[styles.helper, { color: c.textSecondary }]}>
            Paste any direct audio link (<Text style={{ fontWeight: '800' }}>.mp3 / .m4a / .ogg</Text>). The file will be downloaded to your offline library.
          </Text>
          <View style={[styles.urlInputWrap, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}>
            <Ionicons name="link" size={18} color={c.textSecondary} />
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://example.com/song.mp3"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.urlInput, { color: c.textPrimary }]}
              testID="url-input"
            />
          </View>
          <TouchableOpacity
            style={[styles.addUrlBtn, { backgroundColor: c.primary, opacity: checkingUrl || !urlInput.trim() ? 0.6 : 1 }]}
            onPress={onUrlAdd}
            disabled={checkingUrl || !urlInput.trim()}
            testID="url-add-btn"
          >
            {checkingUrl ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.addUrlText}>Download to library</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.disclaim, { borderColor: c.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={c.textTertiary} />
            <Text style={[styles.disclaimText, { color: c.textTertiary }]}>
              Only paste links you have the right to download. You are responsible for respecting the copyright of the content you save.
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function SegmentBtn({ label, icon, active, onPress, c, testID }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.segmentBtn,
        active && { backgroundColor: c.surface, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
      ]}
      testID={testID}
    >
      <Ionicons name={icon} size={16} color={active ? c.textPrimary : c.textSecondary} />
      <Text style={{ color: active ? c.textPrimary : c.textSecondary, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ResultRow({ hit, c, downloading, added, onAdd }: any) {
  return (
    <View style={styles.row} testID={`search-result-${hit.id}`}>
      {hit.artwork_url ? (
        <Image source={{ uri: hit.artwork_url }} style={styles.artImg} />
      ) : (
        <AlbumArt id={hit.id} title={hit.title} size={52} radius={radius.md} />
      )}
      <View style={styles.meta}>
        <Text numberOfLines={1} style={[styles.title, { color: c.textPrimary }]}>{hit.title}</Text>
        <Text numberOfLines={1} style={[styles.artist, { color: c.textSecondary }]}>
          {hit.creator}{hit.duration > 0 ? ` · ${formatDuration(hit.duration)}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onAdd}
        disabled={downloading || added}
        style={[
          styles.addBtn,
          { backgroundColor: added ? c.surfaceSecondary : c.primary },
          downloading && { opacity: 0.7 },
        ]}
        testID={`search-add-${hit.id}`}
      >
        {downloading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : added ? (
          <Ionicons name="checkmark" size={20} color={c.textPrimary} />
        ) : (
          <Ionicons name="download-outline" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  segment: {
    flexDirection: 'row', marginHorizontal: spacing.lg, borderRadius: radius.full,
    padding: 4, marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.full,
  },
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
  artImg: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: '#222' },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  artist: { fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  helper: { fontSize: 13, lineHeight: 20, marginBottom: spacing.md },
  urlInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth,
  },
  urlInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  addUrlBtn: {
    marginTop: spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: radius.full,
  },
  addUrlText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disclaim: {
    marginTop: spacing.lg, flexDirection: 'row', gap: 8,
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disclaimText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

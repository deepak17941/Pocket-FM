import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { usePlayer } from '../../src/context/PlayerContext';
import { useLibrary } from '../../src/context/LibraryContext';
import { useAppTheme, BG_SWATCHES } from '../../src/theme/AppThemeContext';
import { formatMs } from '../../src/utils/format';

const TIMER_OPTIONS = [5, 15, 30, 45, 60, 90];

export default function SettingsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { sleepTimerMs, sleepTimerRemaining, setSleepTimer, sleepEndOfTrack, setSleepEndOfTrack, current } = usePlayer();
  const { tracks, playlists, favorites } = useLibrary();
  const { bgOverride, setBgOverride } = useAppTheme();

  const about = () => {
    Alert.alert('Pocket FM', 'A minimal offline music player.\nVersion 1.0.0\n\nBuilt with Expo & React Native.');
  };

  const hasActiveTimer = sleepTimerMs !== null || sleepEndOfTrack;

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 200 }}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>PREFERENCES</Text>
        <Text style={[styles.h1, { color: c.textPrimary }]}>Settings</Text>
      </View>

      {/* Background theme picker */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>APP BACKGROUND</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.cardText, { color: c.textSecondary }]}>
            Pick a color for the whole app. Auto follows your phone's light/dark mode.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow} testID="bg-swatches">
            {BG_SWATCHES.map((s) => {
              const selected = (s.color ?? null) === bgOverride;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setBgOverride(s.color)}
                  style={styles.swatchWrap}
                  testID={`bg-swatch-${s.id}`}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: s.color ?? 'transparent',
                        borderColor: selected ? c.primary : c.border,
                        borderWidth: selected ? 3 : 1,
                      },
                    ]}
                  >
                    {s.color === null && (
                      <Ionicons name="contrast" size={24} color={c.textPrimary} />
                    )}
                    {selected && (
                      <View style={[styles.tick, { backgroundColor: c.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#0A0A0A" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.swatchLabel, { color: selected ? c.textPrimary : c.textSecondary }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Sleep timer */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>SLEEP TIMER</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {hasActiveTimer ? (
            <View style={styles.activeTimer}>
              <View>
                <Text style={[styles.activeTimerLabel, { color: c.textSecondary }]}>
                  {sleepEndOfTrack ? 'Stops after current track' : 'Stops playback in'}
                </Text>
                <Text style={[styles.activeTimerValue, { color: c.primary }]}>
                  {sleepEndOfTrack ? (current ? current.title : 'No track playing') : formatMs(sleepTimerRemaining ?? 0)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: c.surfaceSecondary }]}
                onPress={() => { setSleepTimer(null); setSleepEndOfTrack(false); }}
                testID="cancel-sleep-timer"
              >
                <Ionicons name="close" size={18} color={c.textPrimary} />
                <Text style={{ color: c.textPrimary, fontWeight: '600', marginLeft: 6 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.cardText, { color: c.textSecondary }]}>
                Auto-pause playback after a set time. Syncs with the player — see the chip in Now Playing.
              </Text>
              <View style={styles.chips}>
                {TIMER_OPTIONS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.chip, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}
                    onPress={() => setSleepTimer(min)}
                    testID={`sleep-timer-${min}`}
                  >
                    <Text style={{ color: c.textPrimary, fontWeight: '700' }}>{min} min</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: c.primary, borderColor: c.primary }]}
                  onPress={() => setSleepEndOfTrack(true)}
                  testID="sleep-timer-eot"
                >
                  <Ionicons name="musical-note" size={14} color="#0A0A0A" />
                  <Text style={{ color: '#0A0A0A', fontWeight: '800', marginLeft: 4 }}>End of track</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>LIBRARY</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, flexDirection: 'row' }]}>
          <StatCell label="Tracks" value={tracks.length} color={c} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <StatCell label="Playlists" value={playlists.length} color={c} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <StatCell label="Favorites" value={favorites.length} color={c} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>ABOUT</Text>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, flexDirection: 'row', alignItems: 'center' }]}
          onPress={about}
          testID="about-button"
        >
          <Ionicons name="information-circle-outline" size={22} color={c.textPrimary} />
          <Text style={{ flex: 1, marginLeft: spacing.md, color: c.textPrimary, fontWeight: '600' }}>About Pocket FM</Text>
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
      <Text style={{ fontSize: 28, fontWeight: '900', color: color.textPrimary, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: color.textSecondary, marginTop: 2 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  h1: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  cardText: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  activeTimer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  activeTimerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  activeTimerValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, maxWidth: 220 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  swatchRow: { paddingHorizontal: 4, gap: 14, paddingVertical: 4 },
  swatchWrap: { alignItems: 'center', gap: 8, marginRight: 2 },
  swatch: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  tick: {
    position: 'absolute', right: -2, top: -2,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchLabel: { fontSize: 11, fontWeight: '700' },
});

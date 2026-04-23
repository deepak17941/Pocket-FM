import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../src/theme/theme';
import { usePlayer } from '../../src/context/PlayerContext';
import { useLibrary } from '../../src/context/LibraryContext';
import { formatMs } from '../../src/utils/format';

const TIMER_OPTIONS = [5, 15, 30, 45, 60, 90];

export default function SettingsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { sleepTimerMs, sleepTimerRemaining, setSleepTimer } = usePlayer();
  const { tracks, playlists, favorites } = useLibrary();

  const about = () => {
    Alert.alert(
      'Pocket FM',
      'A minimal offline music player.\nVersion 1.0.0\n\nBuilt with Expo & React Native. Works on iOS and Android.'
    );
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 200 }}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.textSecondary }]}>PREFERENCES</Text>
        <Text style={[styles.h1, { color: c.textPrimary }]}>Settings</Text>
      </View>

      {/* Sleep timer */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>SLEEP TIMER</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {sleepTimerMs ? (
            <View style={styles.activeTimer}>
              <View>
                <Text style={[styles.activeTimerLabel, { color: c.textSecondary }]}>Stops playback in</Text>
                <Text style={[styles.activeTimerValue, { color: c.primary }]}>
                  {formatMs(sleepTimerRemaining ?? 0)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: c.surfaceSecondary }]}
                onPress={() => setSleepTimer(null)}
                testID="cancel-sleep-timer"
              >
                <Ionicons name="close" size={18} color={c.textPrimary} />
                <Text style={{ color: c.textPrimary, fontWeight: '600', marginLeft: 6 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.cardText, { color: c.textSecondary }]}>
                Automatically pause playback after a set time. Perfect for falling asleep to music.
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

      {/* About */}
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
  card: {
    padding: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth,
  },
  cardText: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  activeTimer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeTimerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  activeTimerValue: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});

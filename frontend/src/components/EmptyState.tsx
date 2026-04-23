import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '../theme/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  testID?: string;
};

export const EmptyState = ({ icon = 'musical-notes-outline', title, subtitle, action, testID }: Props) => {
  const c = useTheme();
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.iconWrap, { backgroundColor: c.surfaceSecondary, borderColor: c.border }]}>
        <Ionicons name={icon} size={36} color={c.textSecondary} />
      </View>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  iconWrap: {
    width: 88, height: 88,
    borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: spacing.xs + 2, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type PillTone = 'safe' | 'primary' | 'warning' | 'danger' | 'neutral';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  tone?: PillTone;
};

const TONE_STYLES: Record<
  PillTone,
  { bg: string; fg: string; icon: string }
> = {
  safe: {
    bg: GuardianColors.safeMuted,
    fg: GuardianColors.safe,
    icon: GuardianColors.safe,
  },
  primary: {
    bg: GuardianColors.navyMuted,
    fg: GuardianColors.primary,
    icon: GuardianColors.primary,
  },
  warning: {
    bg: GuardianColors.warningMuted,
    fg: GuardianColors.warning,
    icon: GuardianColors.warning,
  },
  danger: {
    bg: GuardianColors.dangerMuted,
    fg: GuardianColors.danger,
    icon: GuardianColors.danger,
  },
  neutral: {
    bg: GuardianColors.offlineMuted,
    fg: GuardianColors.textSecondary,
    icon: GuardianColors.textSecondary,
  },
};

export function HistoryStatPill({ icon, value, label, tone = 'primary' }: Props) {
  const palette = TONE_STYLES[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={palette.icon} />
      </View>
      <ThemedText style={[styles.value, { color: palette.fg }]} numberOfLines={1}>
        {value}
      </ThemedText>
      <ThemedText style={styles.label} numberOfLines={2}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 112,
    minHeight: 96,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    gap: 4,
  },
  iconWrap: {
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
    lineHeight: 15,
  },
});

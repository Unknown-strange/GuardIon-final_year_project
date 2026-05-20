import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

export type StatusVariant = 'safe' | 'warning' | 'offline';

const LABELS: Record<StatusVariant, string> = {
  safe: 'SAFE',
  warning: 'WARNING',
  offline: 'OFFLINE',
};

type Props = {
  variant: StatusVariant;
};

export function StatusBadge({ variant }: Props) {
  const palette =
    {
      safe: { bg: GuardianColors.safeMuted, fg: GuardianColors.safe, border: GuardianColors.safe },
      warning: {
        bg: GuardianColors.warningMuted,
        fg: GuardianColors.warning,
        border: GuardianColors.warning,
      },
      offline: {
        bg: GuardianColors.offlineMuted,
        fg: GuardianColors.offline,
        border: GuardianColors.offline,
      },
    }[variant] ?? {
      bg: GuardianColors.offlineMuted,
      fg: GuardianColors.offline,
      border: GuardianColors.offline,
    };

  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <ThemedText style={[styles.label, { color: palette.fg }]}>
        {LABELS[variant] ?? 'UNKNOWN'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});

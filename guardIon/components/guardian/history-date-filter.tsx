import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors } from '@/constants/theme';
import { buildRecentDayKeys, formatDayLabel, type HistoryDayKey } from '@/utils/activity-history';

type Props = {
  value: HistoryDayKey;
  onChange: (dayKey: HistoryDayKey) => void;
};

export function HistoryDateFilter({ value, onChange }: Props) {
  const dayKeys = buildRecentDayKeys(7);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {dayKeys.map((dayKey) => {
        const active = value === dayKey;
        const label = formatDayLabel(dayKey);
        return (
          <Pressable
            key={dayKey}
            onPress={() => onChange(dayKey)}
            style={[styles.chip, active && styles.chipActive]}>
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  chipActive: {
    backgroundColor: GuardianColors.navyMuted,
    borderColor: GuardianColors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: GuardianColors.textSecondary,
  },
  chipTextActive: {
    color: GuardianColors.primary,
    fontWeight: '800',
  },
});

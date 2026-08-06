import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors } from '@/constants/theme';
import type { HistoryFilter } from '@/utils/activity-history';

type Tab = { key: HistoryFilter; label: string };

const TABS: Tab[] = [
  { key: 'all', label: 'All Activity' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'movement', label: 'Movement' },
  { key: 'check_ins', label: 'Check-ins' },
  { key: 'zones', label: 'Zones' },
];

type Props = {
  value: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
};

export function HistoryFilterTabs({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.chip, active && styles.chipActive]}>
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
              {tab.label}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  },
});

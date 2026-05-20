import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  items: ChildSummary[];
  selectedChildId: string | null;
  activeCounts: Record<string, number>;
  onSelect: (childId: string | null) => void;
};

export function AlertsChildSelector({
  items,
  selectedChildId,
  activeCounts,
  onSelect,
}: Props) {
  const allActive = Object.values(activeCounts).reduce((sum, n) => sum + n, 0);
  const allSelected = selectedChildId === null;

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.title}>Select child</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: allSelected }}
          onPress={() => onSelect(null)}
          style={[
            styles.chip,
            allSelected && styles.chipAllSelected,
            { borderColor: allSelected ? GuardianColors.primary : GuardianColors.border },
          ]}>
          <View style={[styles.allIcon, allSelected && styles.allIconSelected]}>
            <Ionicons
              name="people"
              size={20}
              color={allSelected ? '#FFFFFF' : GuardianColors.primary}
            />
          </View>
          <View style={styles.meta}>
            <ThemedText style={[styles.name, allSelected && styles.nameSelected]}>
              All children
            </ThemedText>
            <ThemedText style={styles.hint}>
              {allActive > 0 ? `${allActive} active alert${allActive === 1 ? '' : 's'}` : 'No active alerts'}
            </ThemedText>
          </View>
          {allActive > 0 ? (
            <View style={styles.countPill}>
              <ThemedText style={styles.countText}>{allActive}</ThemedText>
            </View>
          ) : null}
        </Pressable>

        {items.map((child) => {
          const selected = child.id === selectedChildId;
          const colors = getChildColorTheme(child.id);
          const activeCount = activeCounts[child.id] ?? 0;

          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(child.id)}
              style={[
                styles.chip,
                { borderColor: selected ? colors.main : GuardianColors.border },
                selected && { backgroundColor: colors.muted },
              ]}>
              <ChildAvatar
                childId={child.id}
                size={36}
                borderWidth={selected ? 2 : 0}
                borderColor={selected ? colors.main : undefined}
              />
              <View style={styles.meta}>
                <ThemedText
                  style={[styles.name, selected && { color: colors.border }]}
                  numberOfLines={1}>
                  {child.name}
                </ThemedText>
                <ThemedText style={styles.hint} numberOfLines={1}>
                  {child.deviceLabel}
                </ThemedText>
              </View>
              {activeCount > 0 ? (
                <View style={styles.countPill}>
                  <ThemedText style={styles.countText}>{activeCount}</ThemedText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 16,
  },
  title: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  row: {
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: GuardianColors.overlaySheet,
    borderWidth: 1.5,
    minWidth: 170,
  },
  chipAllSelected: {
    backgroundColor: GuardianColors.navyMuted,
  },
  allIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allIconSelected: {
    backgroundColor: GuardianColors.primary,
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 14,
  },
  nameSelected: {
    color: GuardianColors.primary,
  },
  hint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GuardianColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
});

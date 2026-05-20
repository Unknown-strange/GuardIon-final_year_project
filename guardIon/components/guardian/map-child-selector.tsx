import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { StatusBadge } from '@/components/guardian/status-badge';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  items: ChildSummary[];
  selectedChildId: string | null;
  onSelect: (childId: string) => void;
};

export function MapChildSelector({ items, selectedChildId, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.title}>Children</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {items.map((child) => {
          const selected = child.id === selectedChildId;
          const colors = getChildColorTheme(child.id);

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
                <ThemedText style={styles.location} numberOfLines={1}>
                  {child.location}
                </ThemedText>
              </View>
              <StatusBadge variant={child.status} />
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
    minWidth: 190,
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
  location: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
});

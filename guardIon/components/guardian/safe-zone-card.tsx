import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ZoneMiniMap } from '@/components/guardian/zone-mini-map';
import { ThemedText } from '@/components/themed-text';
import { formatZoneSchedule } from '@/constants/demo-safe-zones';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';
import type { SafeZone } from '@/types/safe-zone';
import { zoneColors } from '@/types/safe-zone';

type Props = {
  zone: SafeZone;
  onEdit: () => void;
  onDelete: () => void;
};

export function SafeZoneCard({ zone, onEdit, onDelete }: Props) {
  const colors = getChildColorTheme(zone.childId);
  const zoneStyle = zoneColors(zone.zoneType);
  const scheduled = !!zone.schedule;
  const isDanger = zone.zoneType === 'danger';

  return (
    <View style={styles.card}>
      <View style={styles.mapWrap}>
        <ZoneMiniMap zone={zone} />
        {zone.isActive ? (
          <View style={[styles.activeBadge, { backgroundColor: colors.main }]}>
            <ThemedText style={styles.activeText}>Active</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.name}>{zone.name}</ThemedText>
          <View style={[styles.typePill, { backgroundColor: zoneStyle.muted }]}>
            <ThemedText style={[styles.typePillText, { color: zoneStyle.stroke }]}>
              {isDanger ? 'Danger' : 'Safe'}
            </ThemedText>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="create-outline" size={18} color={GuardianColors.textMuted} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={GuardianColors.textMuted} />
            </Pressable>
          </View>
        </View>

        <ThemedText style={styles.address} numberOfLines={2}>
          {zone.address ?? 'Address not set'}
        </ThemedText>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.pill}>
            <Ionicons name="locate-outline" size={14} color={GuardianColors.textSecondary} />
            <ThemedText style={styles.pillText}>{Math.round(zone.radiusM)}m Radius</ThemedText>
          </View>
          <View style={styles.pill}>
            <Ionicons
              name={scheduled ? 'calendar-outline' : 'ellipse'}
              size={scheduled ? 14 : 8}
              color={GuardianColors.textSecondary}
            />
            <ThemedText style={styles.pillText}>{formatZoneSchedule(zone)}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapWrap: {
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GuardianColors.overlaySheet,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  pillText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
  },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { StatusBadge, type StatusVariant } from '@/components/guardian/status-badge';
import { ThemedText } from '@/components/themed-text';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';

export type ChildSummary = {
  id: string;
  name: string;
  age: number;
  deviceLabel: string;
  location: string;
  latitude: number;
  longitude: number;
  status: StatusVariant;
  movement?: string;
  lastUpdate: string;
  online: boolean;
  alertMessage?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  deviceId?: string;
  profilePhoto?: string;
  /** ISO timestamp of the last GPS fix used for map/online status. */
  coordinatesAt?: string | null;
};

type Props = {
  item: ChildSummary;
  onPress: () => void;
  onLongPress?: () => void;
};

export function ChildSummaryCard({ item, onPress, onLongPress }: Props) {
  const colors = getChildColorTheme(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        { borderColor: colors.muted },
        item.status === 'warning' && styles.cardWarning,
      ]}>
      <View style={[styles.accent, { backgroundColor: colors.main }]} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <ChildAvatar childId={item.id} size={56} borderRadius={12} />
          <View style={styles.meta}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.name}>{item.name}</ThemedText>
              <StatusBadge variant={item.status} />
            </View>
            <ThemedText style={styles.deviceTag} numberOfLines={1}>
              {item.deviceLabel}
            </ThemedText>
            {item.alertMessage ? (
              <ThemedText style={styles.alertText} numberOfLines={2}>
                {item.alertMessage}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.loc} numberOfLines={1}>
              {item.location}
            </ThemedText>
            <View style={styles.statusRow}>
              <Ionicons
                name={item.online ? 'cellular' : 'cloud-offline-outline'}
                size={14}
                color={item.online ? GuardianColors.safe : GuardianColors.offline}
              />
              <ThemedText style={styles.statusText}>
                {item.online ? 'Device Online' : 'Device disconnected'}
              </ThemedText>
            </View>
            {item.movement ? (
              <ThemedText style={styles.movement}>Movement: {item.movement}</ThemedText>
            ) : null}
            <ThemedText style={styles.time}>Last update: {item.lastUpdate}</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardWarning: {
    borderColor: GuardianColors.dangerMuted,
  },
  accent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: GuardianColors.text,
    flexShrink: 1,
  },
  deviceTag: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '600',
  },
  alertText: {
    ...Typography.caption,
    color: GuardianColors.danger,
    fontWeight: '700',
  },
  loc: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
  movement: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
  },
  time: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
});

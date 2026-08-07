import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityMiniMap } from '@/components/guardian/activity-mini-map';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';
import {
  activityIconName,
  formatEventTimeLabel,
  statusBadgeLabel,
  type ActivityHistoryItem,
} from '@/utils/activity-history';

type Props = {
  item: ActivityHistoryItem;
  isLast?: boolean;
  onPress?: () => void;
};

function statusColors(status: ActivityHistoryItem['status']) {
  switch (status) {
    case 'safe':
      return {
        dot: GuardianColors.safe,
        badgeBg: GuardianColors.safeMuted,
        badgeFg: GuardianColors.safe,
        badgeBorder: GuardianColors.safe,
        rail: GuardianColors.safe,
      };
    case 'warning':
      return {
        dot: GuardianColors.warning,
        badgeBg: GuardianColors.warningMuted,
        badgeFg: GuardianColors.warning,
        badgeBorder: GuardianColors.warning,
        rail: GuardianColors.warning,
      };
    case 'danger':
      return {
        dot: GuardianColors.danger,
        badgeBg: GuardianColors.dangerMuted,
        badgeFg: GuardianColors.danger,
        badgeBorder: GuardianColors.danger,
        rail: GuardianColors.danger,
      };
  }
}

export function ActivityTimelineCard({ item, isLast, onPress }: Props) {
  const colors = statusColors(item.status);
  const icon = activityIconName(item.category, item.alertType) as keyof typeof Ionicons.glyphMap;
  const hasMap = item.latitude != null && item.longitude != null;

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <ThemedText style={styles.timeLabel}>
          {formatEventTimeLabel(item.timestamp)}
        </ThemedText>
        <View style={styles.track}>
          <View style={[styles.dot, { backgroundColor: colors.dot }]} />
          {!isLast ? <View style={[styles.line, { backgroundColor: colors.rail }]} /> : null}
        </View>
      </View>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}>
        <View style={[styles.rail, { backgroundColor: colors.rail }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name={icon} size={18} color={colors.badgeFg} />
            </View>
            <View style={styles.cardMeta}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.body} numberOfLines={2}>
                {item.body}
              </ThemedText>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.badgeBg,
                  borderColor: colors.badgeBorder,
                },
              ]}>
              <ThemedText style={[styles.badgeText, { color: colors.badgeFg }]}>
                {statusBadgeLabel(item.status)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFoot}>
            <View style={styles.footMeta}>
              {item.childName ? (
                <ThemedText style={styles.childName}>{item.childName}</ThemedText>
              ) : null}
              <ThemedText style={styles.relativeTime}>{item.relativeTime}</ThemedText>
            </View>
            {hasMap ? (
              <ActivityMiniMap latitude={item.latitude!} longitude={item.longitude!} />
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  timeCol: {
    width: 58,
    alignItems: 'flex-end',
    paddingTop: 14,
  },
  timeLabel: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
    marginBottom: 8,
  },
  track: {
    alignItems: 'center',
    flex: 1,
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    opacity: 0.35,
    minHeight: 24,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.92,
  },
  rail: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: GuardianColors.text,
    lineHeight: 20,
  },
  body: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.label,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footMeta: {
    flex: 1,
    gap: 2,
  },
  childName: {
    ...Typography.caption,
    color: GuardianColors.primary,
    fontWeight: '700',
  },
  relativeTime: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '600',
  },
});

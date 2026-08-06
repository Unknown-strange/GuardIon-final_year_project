import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { formatClockTime, formatDayLabel } from '@/utils/activity-history';

type Props = {
  childName: string;
  confirmedAt: string;
};

export function CheckInAlertReceivedView({ childName, confirmedAt }: Props) {
  const insets = useSafeAreaInsets();
  const dayLabel = formatDayLabel(confirmedAt);
  const timeLabel = formatClockTime(confirmedAt);
  const responseTime =
    dayLabel === 'Today' || dayLabel === 'Yesterday' || dayLabel === 'Tomorrow'
      ? `${dayLabel}, ${timeLabel}`
      : `${dayLabel} · ${timeLabel}`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Check-in Status</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.alertPanel}>
          <View style={styles.alertCircle}>
            <Ionicons name="notifications" size={36} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.alertTitle}>Alert received</ThemedText>
          <ThemedText style={styles.alertSub}>
            {childName} confirmed they are safe
          </ThemedText>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="time-outline" size={20} color={GuardianColors.danger} />
          </View>
          <View>
            <ThemedText style={styles.infoLabel}>Response Time</ThemedText>
            <ThemedText style={styles.infoValue}>{responseTime}</ThemedText>
          </View>
        </View>

        <View style={styles.redirectRow}>
          <ActivityIndicator size="small" color={GuardianColors.danger} />
          <ThemedText style={styles.redirectText}>Opening Alerts…</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    gap: 14,
  },
  alertPanel: {
    backgroundColor: GuardianColors.dangerMuted,
    borderRadius: Layout.cardRadius,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GuardianColors.danger,
  },
  alertCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GuardianColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: GuardianColors.danger,
  },
  alertSub: {
    ...Typography.body,
    color: GuardianColors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GuardianColors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.text,
    marginTop: 2,
  },
  redirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  redirectText: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
  },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityMiniMap } from '@/components/guardian/activity-mini-map';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { formatClockTime, formatDayLabel } from '@/utils/activity-history';

type Props = {
  locationLabel: string;
  latitude: number;
  longitude: number;
  confirmedAt: string;
  onBack: () => void;
  onReturn: () => void;
};

export function CheckInSuccessView({
  locationLabel,
  latitude,
  longitude,
  confirmedAt,
  onBack,
  onReturn,
}: Props) {
  const insets = useSafeAreaInsets();
  const dayLabel = formatDayLabel(confirmedAt);
  const timeLabel = formatClockTime(confirmedAt);
  const responseTime =
    dayLabel === 'Today' || dayLabel === 'Yesterday' || dayLabel === 'Tomorrow'
      ? `${dayLabel}, ${timeLabel}`
      : `${dayLabel} · ${timeLabel}`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Check-in Status</ThemedText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.successPanel}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={36} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.successTitle}>Safe and Sound</ThemedText>
          <ThemedText style={styles.successSub}>Child has confirmed they are safe</ThemedText>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="time-outline" size={20} color={GuardianColors.primary} />
          </View>
          <View>
            <ThemedText style={styles.infoLabel}>Response Time</ThemedText>
            <ThemedText style={styles.infoValue}>{responseTime}</ThemedText>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapCardHead}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color={GuardianColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.infoLabel}>Current Location</ThemedText>
              <ThemedText style={styles.infoValue}>{locationLabel}</ThemedText>
            </View>
          </View>
          <ActivityMiniMap
            latitude={latitude}
            longitude={longitude}
            width="100%"
            height={140}
          />
        </View>

        <PrimaryButton label="Return to Dashboard" onPress={onReturn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    gap: 14,
  },
  successPanel: {
    backgroundColor: GuardianColors.safeMuted,
    borderRadius: Layout.cardRadius,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GuardianColors.safe,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GuardianColors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: GuardianColors.safe,
  },
  successSub: {
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
    backgroundColor: GuardianColors.navyMuted,
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
  mapCard: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    gap: 12,
    overflow: 'hidden',
  },
  mapCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

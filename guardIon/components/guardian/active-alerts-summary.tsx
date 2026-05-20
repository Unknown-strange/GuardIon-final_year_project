import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  activeCount: number;
  selectionLabel: string;
  statusLabel: string;
  statusVariant: 'safe' | 'warning' | 'danger' | 'offline';
  updatedLabel: string;
};

export function ActiveAlertsSummary({
  activeCount,
  selectionLabel,
  statusLabel,
  statusVariant,
  updatedLabel,
}: Props) {
  const pulse = useSharedValue(1);
  const hasActive = activeCount > 0;

  useEffect(() => {
    if (!hasActive) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [hasActive, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const statusColor =
    statusVariant === 'safe'
      ? GuardianColors.safe
      : statusVariant === 'warning'
        ? GuardianColors.warning
        : statusVariant === 'danger'
          ? GuardianColors.danger
          : GuardianColors.offline;

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(320)} style={styles.row}>
      <View style={[styles.heroCard, hasActive ? styles.heroCardActive : styles.heroCardCalm]}>
        {hasActive ? <View style={styles.heroRail} /> : null}
        <View style={styles.heroBody}>
          <ThemedText style={styles.heroLabel}>
            {hasActive ? 'ACTIVE ALERTS' : 'ALL CLEAR'}
          </ThemedText>
          <View style={styles.heroCenter}>
            {hasActive ? (
              <Animated.View style={[styles.badge, pulseStyle]}>
                <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.badgeText}>
                  {activeCount}
                </ThemedText>
              </Animated.View>
            ) : (
              <View style={styles.clearIcon}>
                <Ionicons name="shield-checkmark" size={32} color={GuardianColors.safe} />
              </View>
            )}
          </View>
          <ThemedText style={[styles.heroFoot, hasActive && styles.heroFootActive]}>
            {hasActive ? 'Requires your attention' : 'No active alerts right now'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statusCard}>
        <ThemedText style={styles.statusLabel}>VIEWING</ThemedText>
        <ThemedText style={styles.statusName} numberOfLines={1}>
          {selectionLabel}
        </ThemedText>
        <ThemedText style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</ThemedText>
        <ThemedText style={styles.statusMuted}>{updatedLabel}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  heroCardActive: {
    backgroundColor: GuardianColors.dangerMuted,
    borderColor: '#FECACA',
  },
  heroCardCalm: {
    backgroundColor: GuardianColors.surface,
  },
  heroRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: GuardianColors.danger,
  },
  heroBody: {
    padding: 14,
    paddingLeft: 18,
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
    alignSelf: 'flex-start',
  },
  heroCenter: {
    marginVertical: 4,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GuardianColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GuardianColors.danger,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badgeText: {
    fontSize: 28,
    fontWeight: '900',
  },
  clearIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFoot: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroFootActive: {
    color: GuardianColors.danger,
  },
  statusCard: {
    flex: 1,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    justifyContent: 'center',
    gap: 4,
  },
  statusLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  statusName: {
    fontSize: 16,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  statusMuted: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 4,
  },
});

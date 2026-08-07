import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type Props = {
  childName: string;
  locationLabel: string;
  lastUpdate: string;
  isTimeout?: boolean;
  onBack: () => void;
  onCallEmergency: () => void;
  onCancel: () => void;
  onClose?: () => void;
};

export function CheckInWaitingView({
  childName,
  locationLabel,
  lastUpdate,
  isTimeout,
  onBack,
  onCallEmergency,
  onCancel,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);
  const progress = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.25, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    progress.value = withRepeat(
      withTiming(0.85, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35,
  }));

  const ringOuterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * 1.15 }],
    opacity: 0.2,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Check-in Status</ThemedText>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.hero}>
        <View style={styles.radarWrap}>
          <Animated.View style={[styles.radarRingOuter, ringOuterStyle]} />
          <Animated.View style={[styles.radarRing, ringStyle]} />
          <View style={styles.faceCircle}>
            <Ionicons name="happy-outline" size={42} color="#FFFFFF" />
          </View>
        </View>

        <ThemedText style={styles.title}>
          {isTimeout ? 'No response yet' : 'Waiting for child response…'}
        </ThemedText>
        <ThemedText style={styles.sub}>
          {isTimeout
            ? `${childName} hasn't confirmed yet. Try calling or view their location.`
            : `Your request has been sent to ${childName}'s device. This may take a few moments.`}
        </ThemedText>
      </View>

      {!isTimeout ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <ThemedText style={styles.progressLabel}>Establishing secure connection</ThemedText>
            <Ionicons name="sync-outline" size={16} color={GuardianColors.primary} />
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      ) : null}

      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={18} color={GuardianColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.locationTitle}>Last Known Location</ThemedText>
          <ThemedText style={styles.locationValue} numberOfLines={2}>
            {locationLabel}
          </ThemedText>
        </View>
        <ThemedText style={styles.locationTime}>{lastUpdate}</ThemedText>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Call Emergency Contact instead"
          onPress={onCallEmergency}
        />
        {isTimeout ? (
          <SecondaryButton label="Close" onPress={onClose ?? onBack} />
        ) : (
          <SecondaryButton label="Cancel Check-in" onPress={onCancel} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  hero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  radarWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  radarRingOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: GuardianColors.navyMuted,
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GuardianColors.navyMuted,
  },
  faceCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: GuardianColors.text,
    textAlign: 'center',
  },
  sub: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  progressBlock: {
    marginBottom: 20,
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: GuardianColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GuardianColors.primary,
    borderRadius: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 24,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '800',
    color: GuardianColors.text,
    marginTop: 2,
  },
  locationTime: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
    marginTop: 'auto',
  },
});

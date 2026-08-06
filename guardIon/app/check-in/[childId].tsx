import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CheckInAlertReceivedView } from '@/components/guardian/check-in-alert-received-view';
import { CheckInWaitingView } from '@/components/guardian/check-in-waiting-view';
import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors } from '@/constants/theme';
import { useCheckIn } from '@/hooks/use-check-in';
import { useSafeZones } from '@/hooks/use-safe-zones';
import { announceCheckInSafe } from '@/utils/alert-speech';
import { childInsideSafeZoneName } from '@/types/safe-zone';

export default function CheckInStatusScreen() {
  const { childId: childIdParam } = useLocalSearchParams<{ childId: string }>();
  const childId = String(childIdParam ?? '');
  const router = useRouter();
  const { getChildById } = useGuardianData();
  const child = getChildById(childId);
  const { childZones } = useSafeZones(childId);
  const startedRef = useRef(false);
  const navigatedRef = useRef(false);
  const soundedRef = useRef(false);

  const {
    status,
    confirmedAt,
    start,
    cancelPending,
  } = useCheckIn(childId, child?.online ?? false);

  const [contactsOpen, setContactsOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!child?.online || startedRef.current) return;
    startedRef.current = true;
    start();
  }, [child?.online, start]);

  const locationLabel = useMemo(() => {
    if (!child) return 'Location unavailable';
    const zoneName = childInsideSafeZoneName(child.latitude, child.longitude, childZones);
    if (zoneName) return zoneName;
    return child.location;
  }, [child, childZones]);

  const handleBack = useCallback(async () => {
    if (status === 'pending') {
      setCancelling(true);
      await cancelPending();
      setCancelling(false);
    }
    router.back();
  }, [status, cancelPending, router]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    await cancelPending();
    setCancelling(false);
    router.back();
  }, [cancelPending, router]);

  const handleReturn = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    if (status !== 'confirmed' || !child || soundedRef.current) return;
    soundedRef.current = true;
    void announceCheckInSafe(child.name);
  }, [status, child]);

  useEffect(() => {
    if (status !== 'confirmed' || !confirmedAt || navigatedRef.current) return;

    navigatedRef.current = true;
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)/alerts',
        params: { childId },
      } as any);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, confirmedAt, childId, router]);

  if (!child) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={GuardianColors.primary} />
      </ThemedView>
    );
  }

  if (status === 'confirmed' && confirmedAt) {
    return (
      <CheckInAlertReceivedView
        childName={child.name}
        confirmedAt={confirmedAt}
      />
    );
  }

  if (status === 'pending' || status === 'timeout') {
    return (
      <>
        <CheckInWaitingView
          childName={child.name}
          locationLabel={locationLabel}
          lastUpdate={child.lastUpdate}
          isTimeout={status === 'timeout'}
          onBack={handleBack}
          onCallEmergency={() => setContactsOpen(true)}
          onCancel={handleCancel}
          onClose={handleReturn}
        />
        <ChildContactsSheet
          visible={contactsOpen}
          childId={childId}
          childName={child.name}
          onClose={() => setContactsOpen(false)}
        />
        {cancelling ? (
          <View style={styles.blocking}>
            <ActivityIndicator size="large" color={GuardianColors.primary} />
          </View>
        ) : null}
      </>
    );
  }

  if (status === 'idle' && !child.online) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText style={styles.offlineText}>
          {child.name}&apos;s device went offline. Try again when they reconnect.
        </ThemedText>
        <Pressable onPress={() => router.back()} style={styles.offlineBack}>
          <ThemedText style={styles.offlineBackText}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.loading}>
      <ActivityIndicator size="large" color={GuardianColors.primary} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.background,
  },
  blocking: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    textAlign: 'center',
    color: GuardianColors.textSecondary,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  offlineBack: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: GuardianColors.navyMuted,
  },
  offlineBackText: {
    color: GuardianColors.primary,
    fontWeight: '800',
  },
});

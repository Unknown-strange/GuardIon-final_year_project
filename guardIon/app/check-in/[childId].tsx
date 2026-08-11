import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { CheckInAlertReceivedView } from '@/components/guardian/check-in-alert-received-view';
import { CheckInWaitingView } from '@/components/guardian/check-in-waiting-view';
import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors } from '@/constants/theme';
import { useCheckIn, type CheckInSession } from '@/hooks/use-check-in';
import { useSafeZones } from '@/hooks/use-safe-zones';
import { announceCheckInSafe } from '@/utils/alert-speech';
import { childInsideSafeZoneName } from '@/types/safe-zone';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function CheckInStatusScreen() {
  const params = useLocalSearchParams<{
    childId: string;
    checkInId?: string | string[];
    startedAt?: string | string[];
    childName?: string | string[];
  }>();
  const childId = String(params.childId ?? '');
  const checkInIdParam = firstParam(params.checkInId);
  const startedAtParam = firstParam(params.startedAt);
  const childNameParam = firstParam(params.childName);
  const router = useRouter();
  const { getChildById } = useGuardianData();
  const child = getChildById(childId);
  const { childZones } = useSafeZones(childId);
  const navigatedRef = useRef(false);
  const soundedRef = useRef(false);

  const initialSession = useMemo<CheckInSession | null>(() => {
    if (!checkInIdParam) return null;
    const startedAt =
      startedAtParam && !Number.isNaN(Number(startedAtParam))
        ? Number(startedAtParam)
        : Date.now();
    return { checkInId: checkInIdParam, startedAt };
  }, [checkInIdParam, startedAtParam]);

  const displayName =
    (childNameParam && childNameParam.trim()) || child?.name || 'Your child';

  const { status, confirmedAt, errorMessage, cancelPending } = useCheckIn(
    childId,
    child?.online ?? true,
    initialSession,
  );

  const [contactsOpen, setContactsOpen] = useState(false);

  const locationLabel = useMemo(() => {
    if (!child) return 'Location unavailable';
    const zoneName = childInsideSafeZoneName(child.latitude, child.longitude, childZones);
    if (zoneName) return zoneName;
    return child.location;
  }, [child, childZones]);

  const lastUpdate = child?.lastUpdate ?? '—';
  const isWaiting =
    status === 'pending' || status === 'timeout' || status === 'idle' || status === 'failed';

  const handleBack = useCallback(async () => {
    if (status === 'pending') {
      await cancelPending();
    }
    router.back();
  }, [status, cancelPending, router]);

  const handleCancel = useCallback(async () => {
    await cancelPending();
    router.back();
  }, [cancelPending, router]);

  const handleReturn = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    if (status !== 'confirmed' || soundedRef.current) return;
    soundedRef.current = true;
    void announceCheckInSafe(displayName);
  }, [status, displayName]);

  useEffect(() => {
    if (status !== 'confirmed' || navigatedRef.current) return;

    navigatedRef.current = true;
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)/alerts',
        params: { childId },
      } as any);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, childId, router]);

  if (status === 'confirmed') {
    return (
      <CheckInAlertReceivedView
        childName={displayName}
        confirmedAt={confirmedAt ?? new Date().toISOString()}
      />
    );
  }

  if (status === 'failed') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.messageText}>
          {errorMessage ?? 'Could not start check-in. Please try again.'}
        </ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backBtnText}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (status === 'idle' && child && !child.online) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.messageText}>
          {displayName}&apos;s device went offline. Try again when they reconnect.
        </ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backBtnText}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <>
      <CheckInWaitingView
        childName={displayName}
        locationLabel={locationLabel}
        lastUpdate={lastUpdate}
        isTimeout={status === 'timeout'}
        isStarting={status === 'idle' || !initialSession}
        onBack={handleBack}
        onCallEmergency={() => setContactsOpen(true)}
        onCancel={handleCancel}
        onClose={handleReturn}
      />
      <ChildContactsSheet
        visible={contactsOpen}
        childId={childId}
        childName={displayName}
        onClose={() => setContactsOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.background,
    paddingHorizontal: 32,
  },
  messageText: {
    textAlign: 'center',
    color: GuardianColors.textSecondary,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: GuardianColors.navyMuted,
  },
  backBtnText: {
    color: GuardianColors.primary,
    fontWeight: '800',
  },
});

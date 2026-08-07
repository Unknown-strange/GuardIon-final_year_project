import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import * as checkInsApi from '@/api/check-ins';
import { ApiError } from '@/api/errors';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';

export type CheckInStatus = 'idle' | 'pending' | 'confirmed' | 'timeout';

const POLL_MS = 2500;
const TIMEOUT_MS = 90000;

function storageKey(childId: string) {
  return `@guardian/check-in/${childId}`;
}

function resolveChildId(childId: string | null | undefined) {
  if (!childId || childId === 'none') return null;
  return childId;
}

export function useCheckIn(childId: string | null | undefined, childOnline: boolean) {
  const resolvedChildId = resolveChildId(childId);
  const { bumpRefresh, deviceSafeCheck } = useAlertsRealtime();
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!resolvedChildId) return;
    AsyncStorage.getItem(storageKey(resolvedChildId)).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { lastLabel?: string; lastConfirmedAt?: string };
        if (parsed.lastLabel) setLastLabel(parsed.lastLabel);
        if (parsed.lastConfirmedAt) setConfirmedAt(parsed.lastConfirmedAt);
      } catch {
        /* ignore */
      }
    });
  }, [resolvedChildId]);

  const clearTimers = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimers();
    setStatus('idle');
    checkInIdRef.current = null;
    startedAtRef.current = null;
  }, [clearTimers]);

  const finishConfirmed = useCallback(
    async (label: string, at?: string) => {
      if (!resolvedChildId) return;
      clearTimers();
      const timestamp = at ?? new Date().toISOString();
      setStatus('confirmed');
      setLastLabel(label);
      setConfirmedAt(timestamp);
      bumpRefresh();
      await AsyncStorage.setItem(
        storageKey(resolvedChildId),
        JSON.stringify({
          status: 'confirmed',
          lastConfirmedAt: timestamp,
          lastLabel: label,
        }),
      );
    },
    [resolvedChildId, clearTimers, bumpRefresh],
  );

  const finishTimeout = useCallback(async () => {
    clearTimers();
    const checkInId = checkInIdRef.current;
    if (checkInId) {
      try {
        await checkInsApi.timeoutCheckIn(checkInId);
      } catch {
        /* still show timeout UX */
      }
    }
    setStatus('timeout');
    checkInIdRef.current = null;
    startedAtRef.current = null;
  }, [clearTimers]);

  const applyPollResult = useCallback(
    async (current: checkInsApi.CheckInResponse) => {
      if (current.status === 'confirmed') {
        await finishConfirmed('Just now', current.confirmed_at ?? undefined);
        return;
      }
      if (current.status === 'timeout' || current.status === 'cancelled') {
        clearTimers();
        if (current.status === 'timeout') {
          setStatus('timeout');
        } else {
          setStatus('idle');
        }
        checkInIdRef.current = null;
        startedAtRef.current = null;
      }
    },
    [clearTimers, finishConfirmed],
  );

  const pollCheckIn = useCallback(async () => {
    const expectedId = checkInIdRef.current;
    if (!resolvedChildId || !expectedId) return;

    try {
      const current = await checkInsApi.getCheckIn(expectedId);
      await applyPollResult(current);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        return;
      }

      try {
        const latest = await checkInsApi.getLatestCheckIn(resolvedChildId);
        const startedAt = startedAtRef.current;
        const requestedAt = new Date(latest.requested_at).getTime();
        const matchesSession =
          latest.id === expectedId ||
          (startedAt != null && requestedAt >= startedAt - 3000);

        if (!matchesSession) return;

        if (latest.id !== expectedId) {
          checkInIdRef.current = latest.id;
        }

        await applyPollResult(latest);
      } catch {
        /* keep polling until global timeout */
      }
    }
  }, [resolvedChildId, applyPollResult]);

  const start = useCallback(() => {
    if (!resolvedChildId || !childOnline) return;
    clearTimers();
    setStatus('pending');
    setConfirmedAt(null);
    startedAtRef.current = Date.now();

    void (async () => {
      try {
        const created = await checkInsApi.requestCheckIn(resolvedChildId);
        checkInIdRef.current = created.id;
        await AsyncStorage.setItem(
          storageKey(resolvedChildId),
          JSON.stringify({
            pendingId: created.id,
            startedAt: startedAtRef.current,
          }),
        );
      } catch {
        setStatus('idle');
        startedAtRef.current = null;
        checkInIdRef.current = null;
        return;
      }

      void pollCheckIn();
      pollRef.current = setInterval(() => {
        void pollCheckIn();
      }, POLL_MS);

      timeoutRef.current = setTimeout(() => {
        void finishTimeout();
      }, TIMEOUT_MS);
    })();
  }, [resolvedChildId, childOnline, clearTimers, finishTimeout, pollCheckIn]);

  const cancelPending = useCallback(async () => {
    const checkInId = checkInIdRef.current;
    clearTimers();
    if (checkInId) {
      try {
        await checkInsApi.cancelCheckIn(checkInId);
      } catch {
        /* still reset local state */
      }
    }
    setStatus('idle');
    checkInIdRef.current = null;
    startedAtRef.current = null;
  }, [clearTimers]);

  useEffect(() => {
    if (!resolvedChildId || !deviceSafeCheck) return;
    if (deviceSafeCheck.childId !== resolvedChildId) return;
    void finishConfirmed('Just now');
  }, [deviceSafeCheck, resolvedChildId, finishConfirmed]);

  useEffect(() => {
    if (!resolvedChildId) {
      cancel();
    }
  }, [resolvedChildId, cancel]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    status,
    lastLabel,
    confirmedAt,
    start,
    cancel,
    cancelPending,
    canCheckIn: !!resolvedChildId && childOnline,
  };
}

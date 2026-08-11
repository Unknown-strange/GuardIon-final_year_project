import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import * as checkInsApi from '@/api/check-ins';
import { ApiError } from '@/api/errors';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import {
  beginCheckInApiPause,
  endCheckInApiPause,
} from '@/utils/check-in-api-pause';
import { dedupeInflight } from '@/utils/request-dedupe';

export type CheckInStatus = 'idle' | 'pending' | 'confirmed' | 'timeout' | 'failed';

export type CheckInSession = {
  checkInId: string;
  startedAt: number;
};

const POLL_FALLBACK_MS = 4_000;
const TIMEOUT_MS = 90_000;

function storageKey(childId: string) {
  return `@guardian/check-in/${childId}`;
}

function resolveChildId(childId: string | null | undefined) {
  if (!childId || childId === 'none') return null;
  return childId;
}

/** Create a pending check-in on the server before navigating to the waiting screen. */
export async function createCheckInSession(childId: string): Promise<CheckInSession> {
  return dedupeInflight(`check-in:create:${childId}`, async () => {
    beginCheckInApiPause();
    try {
      const created = await checkInsApi.requestCheckIn(childId);
      const startedAt = Date.now();
      await AsyncStorage.setItem(
        storageKey(childId),
        JSON.stringify({
          pendingId: created.id,
          startedAt,
        }),
      );
      return { checkInId: created.id, startedAt };
    } finally {
      endCheckInApiPause();
    }
  });
}

export function useCheckIn(
  childId: string | null | undefined,
  childOnline: boolean,
  initialSession?: CheckInSession | null,
) {
  const resolvedChildId = resolveChildId(childId);
  const { bumpRefresh, deviceSafeCheck } = useAlertsRealtime();
  const [status, setStatus] = useState<CheckInStatus>(() =>
    initialSession ? 'pending' : 'idle',
  );
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInIdRef = useRef<string | null>(initialSession?.checkInId ?? null);
  const startedAtRef = useRef<number | null>(initialSession?.startedAt ?? null);
  const sessionAttachedRef = useRef(false);
  const sessionPauseRef = useRef(false);
  const pollInFlightRef = useRef(false);

  const endSessionPause = useCallback(() => {
    if (!sessionPauseRef.current) return;
    sessionPauseRef.current = false;
    endCheckInApiPause();
  }, []);

  const beginSessionPause = useCallback(() => {
    if (sessionPauseRef.current) return;
    sessionPauseRef.current = true;
    beginCheckInApiPause();
  }, []);

  useEffect(() => {
    if (!resolvedChildId || initialSession || sessionAttachedRef.current) return;
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
  }, [resolvedChildId, initialSession]);

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
    endSessionPause();
    setStatus('idle');
    setErrorMessage(null);
    checkInIdRef.current = null;
    startedAtRef.current = null;
    sessionAttachedRef.current = false;
  }, [clearTimers, endSessionPause]);

  const finishConfirmed = useCallback(
    async (label: string, at?: string) => {
      if (!resolvedChildId) return;
      clearTimers();
      endSessionPause();
      const timestamp = at ?? new Date().toISOString();
      setStatus('confirmed');
      setErrorMessage(null);
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
    [resolvedChildId, clearTimers, endSessionPause, bumpRefresh],
  );

  const finishTimeout = useCallback(async () => {
    clearTimers();
    endSessionPause();
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
    sessionAttachedRef.current = false;
  }, [clearTimers, endSessionPause]);

  const applyPollResult = useCallback(
    async (current: checkInsApi.CheckInResponse) => {
      if (current.status === 'confirmed') {
        await finishConfirmed('Just now', current.confirmed_at ?? undefined);
        return;
      }
      if (current.status === 'timeout' || current.status === 'cancelled') {
        clearTimers();
        endSessionPause();
        if (current.status === 'timeout') {
          setStatus('timeout');
        } else {
          setStatus('idle');
        }
        checkInIdRef.current = null;
        startedAtRef.current = null;
        sessionAttachedRef.current = false;
      }
    },
    [clearTimers, endSessionPause, finishConfirmed],
  );

  const pollCheckIn = useCallback(async () => {
    const expectedId = checkInIdRef.current;
    if (!resolvedChildId || !expectedId || pollInFlightRef.current) return;

    pollInFlightRef.current = true;
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
        /* WebSocket or next poll may still confirm */
      }
    } finally {
      pollInFlightRef.current = false;
    }
  }, [resolvedChildId, applyPollResult]);

  const attachSession = useCallback(
    (session: CheckInSession) => {
      clearTimers();
      beginSessionPause();
      checkInIdRef.current = session.checkInId;
      startedAtRef.current = session.startedAt;
      setStatus('pending');
      setConfirmedAt(null);
      setErrorMessage(null);

      void pollCheckIn();
      pollRef.current = setInterval(() => {
        void pollCheckIn();
      }, POLL_FALLBACK_MS);

      const elapsed = Date.now() - session.startedAt;
      const remaining = Math.max(0, TIMEOUT_MS - elapsed);
      timeoutRef.current = setTimeout(() => {
        void finishTimeout();
      }, remaining);
    },
    [clearTimers, beginSessionPause, finishTimeout, pollCheckIn],
  );

  const start = useCallback(() => {
    if (!resolvedChildId || !childOnline || sessionAttachedRef.current) return;
    sessionAttachedRef.current = true;
    setStatus('pending');
    setConfirmedAt(null);
    setErrorMessage(null);

    void (async () => {
      try {
        const session = await createCheckInSession(resolvedChildId);
        attachSession(session);
      } catch {
        setStatus('failed');
        setErrorMessage('Could not send the check-in request. Please try again.');
        sessionAttachedRef.current = false;
        checkInIdRef.current = null;
        startedAtRef.current = null;
      }
    })();
  }, [resolvedChildId, childOnline, attachSession]);

  useEffect(() => {
    if (!initialSession || !resolvedChildId || sessionAttachedRef.current) return;
    sessionAttachedRef.current = true;
    attachSession(initialSession);
  }, [initialSession, resolvedChildId, attachSession]);

  useEffect(() => {
    if (initialSession || !resolvedChildId || !childOnline || sessionAttachedRef.current) return;
    start();
  }, [initialSession, resolvedChildId, childOnline, start]);

  const cancelPending = useCallback(async () => {
    const checkInId = checkInIdRef.current;
    clearTimers();
    endSessionPause();
    if (checkInId) {
      try {
        await checkInsApi.cancelCheckIn(checkInId);
      } catch {
        /* still reset local state */
      }
    }
    setStatus('idle');
    setErrorMessage(null);
    checkInIdRef.current = null;
    startedAtRef.current = null;
    sessionAttachedRef.current = false;
  }, [clearTimers, endSessionPause]);

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

  useEffect(() => () => {
    clearTimers();
    endSessionPause();
  }, [clearTimers, endSessionPause]);

  return {
    status,
    lastLabel,
    confirmedAt,
    errorMessage,
    start,
    cancel,
    cancelPending,
    canCheckIn: !!resolvedChildId && childOnline,
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CheckInStatus = 'idle' | 'pending' | 'confirmed' | 'timeout';

function storageKey(childId: string) {
  return `@guardian/check-in/${childId}`;
}

export function useCheckIn(childId: string, childOnline: boolean) {
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey(childId)).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { lastLabel?: string };
        if (parsed.lastLabel) setLastLabel(parsed.lastLabel);
      } catch {
        /* ignore */
      }
    });
  }, [childId]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = useCallback(() => {
    clearTimer();
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    if (!childOnline) return;
    clearTimer();
    setStatus('pending');

    timerRef.current = setTimeout(async () => {
      const label = 'Just now';
      setStatus('confirmed');
      setLastLabel(label);
      await AsyncStorage.setItem(
        storageKey(childId),
        JSON.stringify({ status: 'confirmed', lastConfirmedAt: new Date().toISOString(), lastLabel: label }),
      );
    }, 2500);
  }, [childId, childOnline]);

  useEffect(() => () => clearTimer(), []);

  return { status, lastLabel, start, cancel, canCheckIn: childOnline };
}

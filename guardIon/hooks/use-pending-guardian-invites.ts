import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';

import * as guardiansApi from '@/api/guardians';
import type { GuardianInviteResponse } from '@/api/guardians';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianData } from '@/contexts/guardian-data-context';

const INVITES_FOCUS_MIN_MS = 60_000;

export function usePendingGuardianInvites(enabled = false) {
  const { isAuthenticated } = useAuth();
  const { isLoading: guardianLoading } = useGuardianData();
  const [invites, setInvites] = useState<GuardianInviteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const invitesRef = useRef(invites);
  invitesRef.current = invites;
  const hasLoadedOnceRef = useRef(false);
  const lastFetchRef = useRef(0);
  const fetchInflightRef = useRef<Promise<void> | null>(null);

  const refreshInvites = useCallback(
    async (options?: { background?: boolean; force?: boolean }) => {
      if (!isAuthenticated || !enabled) {
        if (!enabled) {
          setInvites([]);
          hasLoadedOnceRef.current = false;
        }
        return;
      }

      const background = options?.background === true;
      if (background && !options?.force) {
        const now = Date.now();
        if (now - lastFetchRef.current < INVITES_FOCUS_MIN_MS) return;
      }

      if (fetchInflightRef.current) return fetchInflightRef.current;

      const hasCached = invitesRef.current.length > 0 || hasLoadedOnceRef.current;
      if (!background || !hasCached) {
        setIsLoading(true);
      }

      const run = async () => {
        try {
          const { invites: pending } = await guardiansApi.listPendingInvites();
          setInvites(pending);
          hasLoadedOnceRef.current = true;
          lastFetchRef.current = Date.now();
        } catch {
          if (!background) {
            setInvites([]);
          }
        } finally {
          setIsLoading(false);
        }
      };

      const promise = run().finally(() => {
        fetchInflightRef.current = null;
      });
      fetchInflightRef.current = promise;
      return promise;
    },
    [enabled, isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled || guardianLoading) return;
      void refreshInvites({ background: true });
    }, [enabled, guardianLoading, refreshInvites]),
  );

  useEffect(() => {
    if (!isAuthenticated || !enabled || Platform.OS === 'web') return;

    const sub = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as { type?: string } | undefined;
      if (data?.type === 'guardian_invite') {
        void refreshInvites({ force: true });
      }
    });

    return () => sub.remove();
  }, [enabled, isAuthenticated, refreshInvites]);

  const acceptInvite = useCallback(async (guardianId: string) => {
    const accepted = await guardiansApi.acceptGuardianInvite(guardianId);
    setInvites((prev) => prev.filter((invite) => invite.id !== guardianId));
    return accepted;
  }, []);

  const declineInvite = useCallback(async (guardianId: string) => {
    await guardiansApi.declineGuardianInvite(guardianId);
    setInvites((prev) => prev.filter((invite) => invite.id !== guardianId));
  }, []);

  return {
    invites,
    isLoading,
    refreshInvites,
    acceptInvite,
    declineInvite,
  };
}

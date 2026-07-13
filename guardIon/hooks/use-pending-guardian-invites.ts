import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';

import * as guardiansApi from '@/api/guardians';
import type { GuardianInviteResponse } from '@/api/guardians';
import { useAuth } from '@/contexts/auth-context';

export function usePendingGuardianInvites() {
  const { isAuthenticated } = useAuth();
  const [invites, setInvites] = useState<GuardianInviteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshInvites = useCallback(async () => {
    if (!isAuthenticated) {
      setInvites([]);
      return;
    }

    setIsLoading(true);
    try {
      const { invites: pending } = await guardiansApi.listPendingInvites();
      setInvites(pending);
    } catch {
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshInvites();
  }, [refreshInvites]);

  useFocusEffect(
    useCallback(() => {
      void refreshInvites();
    }, [refreshInvites]),
  );

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    const sub = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as { type?: string } | undefined;
      if (data?.type === 'guardian_invite') {
        void refreshInvites();
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, refreshInvites]);

  const acceptInvite = useCallback(
    async (guardianId: string) => {
      const accepted = await guardiansApi.acceptGuardianInvite(guardianId);
      setInvites((prev) => prev.filter((invite) => invite.id !== guardianId));
      return accepted;
    },
    [],
  );

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

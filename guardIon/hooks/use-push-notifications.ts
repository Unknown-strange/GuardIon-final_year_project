import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { registerPushToken } from '@/api/push';
import { registerUserSession } from '@/api/preferences';
import { useAuth } from '@/contexts/auth-context';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import type { AlertWsPayload } from '@/hooks/use-alerts-websocket';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResult.data;
  } catch {
    return null;
  }
}

type PushData = {
  type?: string;
  alert_id?: string;
  child_id?: string;
  image_url?: string;
  reporter_name?: string;
  notes?: string;
};

function missingAlertFromPush(data: PushData): AlertWsPayload | null {
  if (!data.alert_id || !data.child_id) return null;
  return {
    alert_id: data.alert_id,
    alert_type: 'child_missing',
    child_id: data.child_id,
    image_url: data.image_url ?? null,
    reporter_name: data.reporter_name ?? null,
    notes: data.notes ?? null,
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

function handlePushNavigation(data: PushData | undefined, openMissingChildAlert: (p: AlertWsPayload) => void) {
  if (!data?.type) return;

  if (data.type === 'guardian_invite') {
    router.push('/(tabs)/' as any);
    return;
  }

  if (data.type === 'child_missing') {
    const payload = missingAlertFromPush(data);
    if (payload) {
      openMissingChildAlert(payload);
    }
    router.push('/(tabs)/alerts' as any);
  }
}

export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
  const { openMissingChildAlert } = useAlertsRealtime();
  const registeredRef = useRef(false);

  const register = useCallback(async () => {
    if (!isAuthenticated || !user || registeredRef.current) return;

    try {
      const token = await getExpoPushToken();
      const deviceName = `${Platform.OS} · ${Constants.deviceName ?? 'GuardIon'}`;

      await registerUserSession({
        device_name: deviceName,
        platform: Platform.OS,
        user_agent: Constants.expoConfig?.slug,
      });

      if (token) {
        await registerPushToken({
          token,
          platform: Platform.OS,
          device_name: deviceName,
        });
      }

      registeredRef.current = true;
    } catch {
      /* best-effort */
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void register();
  }, [register]);

  useEffect(() => {
    if (!isAuthenticated) registeredRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const receivedSub = Notifications.addNotificationReceivedListener((event) => {
      const data = event.request.content.data as PushData | undefined;
      handlePushNavigation(data, openMissingChildAlert);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushData | undefined;
      handlePushNavigation(data, openMissingChildAlert);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated, openMissingChildAlert]);
}

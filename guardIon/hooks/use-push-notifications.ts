import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { registerPushToken } from '@/api/push';
import { registerUserSession } from '@/api/preferences';
import { useAuth } from '@/contexts/auth-context';

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

export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
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
}

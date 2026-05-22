import { usePushNotifications } from '@/hooks/use-push-notifications';

/** Registers push token and user session when authenticated. */
export function PushNotificationsBridge() {
  usePushNotifications();
  return null;
}

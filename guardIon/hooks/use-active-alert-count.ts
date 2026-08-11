import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';

/** Badge count from shared alerts poll — no extra API call. */
export function useActiveAlertCount() {
  const { activeAlertCount } = useAlertsRealtime();
  return activeAlertCount;
}

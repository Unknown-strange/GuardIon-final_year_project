import { useCallback, useEffect, useState } from 'react';

import * as alertsApi from '@/api/alerts';
import * as locationsApi from '@/api/locations';
import { alertFromApi, historyItemFromLocation } from '@/api/mappers';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianData } from '@/contexts/guardian-data-context';

export type HistoryItem = {
  id: string;
  title: string;
  sub: string;
  time: string;
};

export function useActivityHistory() {
  const { isAuthenticated } = useAuth();
  const { children } = useGuardianData();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const childNameById = new Map(children.map((child) => [child.id, child.name]));
      const [alertsResult, ...locationResults] = await Promise.all([
        alertsApi.getAlertHistory({ limit: 20 }),
        ...children
          .filter((child) => child.deviceId)
          .map(async (child) => {
            try {
              const history = await locationsApi.getDeviceLocationHistory(child.deviceId!, {
                limit: 5,
              });
              return history.locations.map((point) =>
                historyItemFromLocation({
                  id: point.id,
                  title: `Location update · ${childNameById.get(child.id) ?? 'Child'}`,
                  latitude: point.latitude,
                  longitude: point.longitude,
                  timestamp: point.timestamp,
                }),
              );
            } catch {
              return [];
            }
          }),
      ]);

      const alertItems = alertsResult.alerts.map((alert) => {
        const mapped = alertFromApi(alert, childNameById.get(alert.child_id));
        return {
          id: mapped.id,
          title: mapped.title,
          sub: mapped.body,
          time: mapped.time,
        };
      });

      setItems(
        [...alertItems, ...locationResults.flat()]
          .slice(0, 30),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [children, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

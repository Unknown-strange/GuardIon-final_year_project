import { useCallback, useEffect, useMemo, useState } from 'react';

import * as alertsApi from '@/api/alerts';
import { alertFromApi } from '@/api/mappers';
import type { AlertItem } from '@/constants/alerts-mocks';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianData } from '@/contexts/guardian-data-context';

type AlertFilter = 'all' | 'active' | 'resolved';

export function useAlerts(filter: AlertFilter = 'all') {
  const { isAuthenticated } = useAuth();
  const { children } = useGuardianData();
  const { refreshSeq } = useAlertsRealtime();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const childNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const child of children) map.set(child.id, child.name);
    return map;
  }, [children]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        alertsApi.getActiveAlerts(),
        alertsApi.getAlertHistory({ limit: 100 }),
      ]);
      const merged = [...active.alerts, ...history.alerts];
      const unique = new Map<string, (typeof merged)[number]>();
      for (const alert of merged) unique.set(alert.id, alert);
      const mapped = Array.from(unique.values()).map((alert) =>
        alertFromApi(alert, childNameById.get(alert.child_id)),
      );
      setAlerts(mapped);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [childNameById, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSeq]);

  const filtered = useMemo(() => {
    if (filter === 'active') return alerts.filter((a) => a.state === 'active');
    if (filter === 'resolved') return alerts.filter((a) => a.state === 'resolved');
    return alerts;
  }, [alerts, filter]);

  const resolveAlertById = useCallback(
    async (alertId: string, responseText?: string) => {
      await alertsApi.resolveAlert(alertId, responseText);
      await refresh();
    },
    [refresh],
  );

  return {
    alerts: filtered,
    allAlerts: alerts,
    loading,
    refresh,
    resolveAlertById,
  };
}

export function getAlertsForChild(allAlerts: AlertItem[], childId: string) {
  return allAlerts.filter((alert) => alert.childId === childId);
}

export function getActiveAlertCount(allAlerts: AlertItem[]) {
  return allAlerts.filter((alert) => alert.state === 'active').length;
}

export function getActiveAlertCountsByChild(allAlerts: AlertItem[]) {
  const counts: Record<string, number> = {};
  for (const alert of allAlerts) {
    if (alert.state !== 'active') continue;
    counts[alert.childId] = (counts[alert.childId] ?? 0) + 1;
  }
  return counts;
}

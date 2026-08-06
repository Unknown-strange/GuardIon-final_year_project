import { useCallback, useState } from 'react';

import * as activityApi from '@/api/activity';
import { useAuth } from '@/contexts/auth-context';
import {
  computeActivityStats,
  dayRangeBounds,
  filterByChild,
  mapActivityApiItem,
  type ActivityHistoryItem,
  type ActivityHistoryStats,
  type HistoryDayKey,
} from '@/utils/activity-history';

export type { ActivityHistoryItem } from '@/utils/activity-history';

type UseActivityHistoryOptions = {
  selectedChildId: string | null;
  selectedDayKey: HistoryDayKey;
};

export function useActivityHistory({
  selectedChildId,
  selectedDayKey,
}: UseActivityHistoryOptions) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ActivityHistoryItem[]>([]);
  const [stats, setStats] = useState<ActivityHistoryStats>({
    safeZonesVisited: 0,
    checkInsCompleted: 0,
    alertsTriggered: 0,
    timeActiveLabel: '—',
    lastLocationLabel: '—',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (options?: { pull?: boolean }) => {
      if (!isAuthenticated) {
        setItems([]);
        setStats({
          safeZonesVisited: 0,
          checkInsCompleted: 0,
          alertsTriggered: 0,
          timeActiveLabel: '—',
          lastLocationLabel: '—',
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (options?.pull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const { start, end } = dayRangeBounds(selectedDayKey);
        const result = await activityApi.getActivityFeed({
          start_time: start,
          end_time: end,
          limit: 150,
        });

        const mapped = result.items.map(mapActivityApiItem);
        setItems(mapped);

        const scoped = filterByChild(mapped, selectedChildId);
        setStats(computeActivityStats(scoped));
      } catch {
        setItems([]);
        setStats({
          safeZonesVisited: 0,
          checkInsCompleted: 0,
          alertsTriggered: 0,
          timeActiveLabel: '—',
          lastLocationLabel: '—',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, selectedChildId, selectedDayKey],
  );

  return { items, stats, loading, refreshing, refresh };
}

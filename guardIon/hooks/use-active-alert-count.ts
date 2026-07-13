import { useCallback, useEffect, useState } from 'react';

import * as alertsApi from '@/api/alerts';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import { useAuth } from '@/contexts/auth-context';

export function useActiveAlertCount() {
  const { isAuthenticated } = useAuth();
  const { refreshSeq } = useAlertsRealtime();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }

    try {
      const { alerts } = await alertsApi.getActiveAlerts();
      setCount(alerts.length);
    } catch {
      setCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSeq]);

  return count;
}

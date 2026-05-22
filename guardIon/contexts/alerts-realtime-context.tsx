import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { GuardianToast } from '@/components/guardian/guardian-toast';
import * as alertsApi from '@/api/alerts';
import { safeZoneFromApi } from '@/api/mappers';
import * as safezonesApi from '@/api/safezones';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianData } from '@/contexts/guardian-data-context';
import {
  useAlertsWebSocket,
  type AlertWsPayload,
} from '@/hooks/use-alerts-websocket';
import type { SafeZone } from '@/types/safe-zone';
import { childGeofenceStatus, isPointInZone } from '@/types/safe-zone';
import { announceLiveAlert } from '@/utils/alert-speech';

type AlertsRealtimeContextValue = {
  refreshSeq: number;
  bumpRefresh: () => void;
  lastLiveAlert: AlertWsPayload | null;
  /** Set when the device sends CHECK_IN_SAFE — closes pending check-in UI. */
  deviceSafeCheck: { childId: string; seq: number } | null;
};

const AlertsRealtimeContext = createContext<AlertsRealtimeContextValue | null>(null);

const ACTIVE_ALERT_POLL_MS = 5_000;
const GEOFENCE_ANNOUNCE_COOLDOWN_MS = 20_000;

function isAnnounceableAlert(alertType: string) {
  const type = alertType.trim().toUpperCase().replace(/-/g, '_');
  return type === 'SOS' || type === 'GEOFENCE_BREACH';
}

/** Voluntary safe check-in — refresh list + light banner only (no alarm / speech). */
function isQuietCheckInSafeAlert(alertType: string) {
  return alertType.trim().toUpperCase().replace(/-/g, '_') === 'CHECK_IN_SAFE';
}

type GeofenceTrackState = {
  inside: boolean;
  zoneName?: string;
};

export function AlertsRealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { children: guardianChildren, locationTick } = useGuardianData();
  const { lastAlert } = useAlertsWebSocket(user?.id, isAuthenticated);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [deviceSafeCheck, setDeviceSafeCheck] = useState<{ childId: string; seq: number } | null>(
    null,
  );
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [zonesByChild, setZonesByChild] = useState<Record<string, SafeZone[]>>({});

  const spokenAlertIdsRef = useRef<Set<string>>(new Set());
  const seenCheckInIdsRef = useRef<Set<string>>(new Set());
  const alertsBaselineDoneRef = useRef(false);
  const sessionStartedAtRef = useRef(Date.now());
  const geofenceTrackRef = useRef<Map<string, GeofenceTrackState>>(new Map());
  const geofenceAnnounceAtRef = useRef<Map<string, number>>(new Map());

  const childNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const child of guardianChildren) map.set(child.id, child.name);
    return map;
  }, [guardianChildren]);

  const bumpRefresh = useCallback(() => {
    setRefreshSeq((value) => value + 1);
  }, []);

  const tryAnnounceGeofenceExit = useCallback(
    (childId: string, childName: string, zoneName?: string | null, dedupeKey?: string) => {
      const key = dedupeKey ?? `geofence-exit:${childId}`;
      if (spokenAlertIdsRef.current.has(key)) return false;

      const now = Date.now();
      const lastAt = geofenceAnnounceAtRef.current.get(childId) ?? 0;
      if (now - lastAt < GEOFENCE_ANNOUNCE_COOLDOWN_MS) return false;

      spokenAlertIdsRef.current.add(key);
      geofenceAnnounceAtRef.current.set(childId, now);

      void announceLiveAlert('geofence_breach', childName, zoneName ?? undefined);
      const zone = zoneName?.trim() || 'safe zone';
      setBannerMessage(`${childName} left ${zone}`);
      bumpRefresh();
      return true;
    },
    [bumpRefresh],
  );

  const announceAlert = useCallback(
    (
      alertId: string,
      alertType: string,
      childId: string,
      zoneName?: string | null,
      childNameOverride?: string,
    ) => {
      if (!isAnnounceableAlert(alertType)) return false;

      const childName = childNameOverride ?? childNameById.get(childId) ?? 'Your child';
      const type = alertType.trim().toUpperCase().replace(/-/g, '_');

      if (type === 'GEOFENCE_BREACH') {
        return tryAnnounceGeofenceExit(childId, childName, zoneName, alertId);
      }

      if (spokenAlertIdsRef.current.has(alertId)) return false;
      spokenAlertIdsRef.current.add(alertId);

      void announceLiveAlert(alertType, childName, zoneName ?? undefined);
      setBannerMessage(`SOS — ${childName} pressed the panic button`);
      bumpRefresh();
      return true;
    },
    [childNameById, bumpRefresh, tryAnnounceGeofenceExit],
  );

  const notifyDeviceSafeCheck = useCallback(
    (childId: string) => {
      setDeviceSafeCheck((prev) => ({ childId, seq: (prev?.seq ?? 0) + 1 }));
      bumpRefresh();
    },
    [bumpRefresh],
  );

  const handleQuietCheckInSafe = useCallback(
    (alertId: string, childId: string) => {
      if (seenCheckInIdsRef.current.has(alertId)) return false;
      seenCheckInIdsRef.current.add(alertId);
      notifyDeviceSafeCheck(childId);
      const childName = childNameById.get(childId) ?? 'Your child';
      setBannerMessage(`Safe check-in — ${childName} confirmed they're okay`);
      return true;
    },
    [childNameById, notifyDeviceSafeCheck],
  );

  const processAlertListItem = useCallback(
    (alert: {
      id: string;
      alert_type: string;
      child_id: string;
      zone_name?: string | null;
      created_at: string;
    }) => {
      const createdMs = new Date(alert.created_at).getTime();
      const isHistorical =
        alertsBaselineDoneRef.current &&
        createdMs < sessionStartedAtRef.current - 3_000;

      if (isQuietCheckInSafeAlert(alert.alert_type)) {
        if (!isHistorical) handleQuietCheckInSafe(alert.id, alert.child_id);
        else seenCheckInIdsRef.current.add(alert.id);
        return;
      }

      if (isHistorical) {
        spokenAlertIdsRef.current.add(alert.id);
        return;
      }

      announceAlert(alert.id, alert.alert_type, alert.child_id, alert.zone_name);
    },
    [announceAlert, handleQuietCheckInSafe],
  );

  useEffect(() => {
    if (!isAuthenticated || guardianChildren.length === 0) {
      setZonesByChild({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        guardianChildren.map(async (child) => {
          try {
            const apiZones = await safezonesApi.listSafeZonesForChild(child.id);
            return [child.id, apiZones.map(safeZoneFromApi)] as const;
          } catch {
            return [child.id, []] as const;
          }
        }),
      );
      if (!cancelled) setZonesByChild(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, guardianChildren]);

  useEffect(() => {
    if (!isAuthenticated || locationTick === 0) return;

    for (const child of guardianChildren) {
      const zones = zonesByChild[child.id] ?? [];
      if (zones.length === 0) continue;
      if (child.latitude == null || child.longitude == null) continue;

      const status = childGeofenceStatus(child.latitude, child.longitude, zones);
      const inside = status === 'inside';
      const prev = geofenceTrackRef.current.get(child.id);

      if (prev?.inside === true && !inside) {
        tryAnnounceGeofenceExit(child.id, child.name, prev.zoneName);
      }

      let zoneName: string | undefined;
      if (inside) {
        const zone = zones.find((z) =>
          isPointInZone(child.latitude!, child.longitude!, z),
        );
        zoneName = zone?.name;
      }

      geofenceTrackRef.current.set(child.id, { inside, zoneName });
    }
  }, [
    isAuthenticated,
    locationTick,
    guardianChildren,
    zonesByChild,
    tryAnnounceGeofenceExit,
  ]);

  useEffect(() => {
    if (!lastAlert) return;
    if (isQuietCheckInSafeAlert(lastAlert.alert_type)) {
      handleQuietCheckInSafe(lastAlert.alert_id, lastAlert.child_id);
      return;
    }
    if (!isAnnounceableAlert(lastAlert.alert_type)) {
      bumpRefresh();
      return;
    }
    announceAlert(
      lastAlert.alert_id,
      lastAlert.alert_type,
      lastAlert.child_id,
      lastAlert.zone_name,
      lastAlert.child_name,
    );
  }, [lastAlert, announceAlert, bumpRefresh, handleQuietCheckInSafe]);

  const pollActiveAlerts = useCallback(async () => {
    try {
      const { alerts } = await alertsApi.getActiveAlerts();

      if (!alertsBaselineDoneRef.current) {
        for (const alert of alerts) {
          const createdMs = new Date(alert.created_at).getTime();
          if (createdMs < sessionStartedAtRef.current - 3_000) {
            spokenAlertIdsRef.current.add(alert.id);
            seenCheckInIdsRef.current.add(alert.id);
          } else {
            processAlertListItem(alert);
          }
        }
        alertsBaselineDoneRef.current = true;
        bumpRefresh();
        return;
      }

      for (const alert of alerts) {
        processAlertListItem(alert);
      }
    } catch {
      /* ignore transient network errors */
    }
  }, [bumpRefresh, processAlertListItem]);

  useEffect(() => {
    if (!isAuthenticated) {
      alertsBaselineDoneRef.current = false;
      sessionStartedAtRef.current = Date.now();
      spokenAlertIdsRef.current.clear();
      seenCheckInIdsRef.current.clear();
      geofenceTrackRef.current.clear();
      geofenceAnnounceAtRef.current.clear();
      return;
    }

    void pollActiveAlerts();
    const interval = setInterval(() => {
      void pollActiveAlerts();
    }, ACTIVE_ALERT_POLL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, pollActiveAlerts]);

  useEffect(() => {
    if (!isAuthenticated || locationTick === 0 || !alertsBaselineDoneRef.current) return;
    void pollActiveAlerts();
  }, [isAuthenticated, locationTick, pollActiveAlerts]);

  const value = useMemo(
    () => ({
      refreshSeq,
      bumpRefresh,
      lastLiveAlert: lastAlert,
      deviceSafeCheck,
    }),
    [refreshSeq, bumpRefresh, lastAlert, deviceSafeCheck],
  );

  return (
    <AlertsRealtimeContext.Provider value={value}>
      {children}
      <GuardianToast
        visible={!!bannerMessage}
        message={bannerMessage ?? ''}
        durationMs={6000}
        onHide={() => setBannerMessage(null)}
      />
    </AlertsRealtimeContext.Provider>
  );
}

export function useAlertsRealtime() {
  const ctx = useContext(AlertsRealtimeContext);
  if (!ctx) {
    throw new Error('useAlertsRealtime must be used within AlertsRealtimeProvider');
  }
  return ctx;
}

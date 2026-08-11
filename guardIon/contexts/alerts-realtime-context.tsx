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

import { MissingChildAlertModal } from '@/components/guardian/missing-child-alert-modal';

import * as alertsApi from '@/api/alerts';

import { useAuth } from '@/contexts/auth-context';

import { useGuardianData } from '@/contexts/guardian-data-context';

import {

  useAlertsWebSocket,

  type AlertWsPayload,

} from '@/hooks/use-alerts-websocket';

import { useAppForeground } from '@/hooks/use-app-foreground';

import { useIsGuardianTabFocused } from '@/hooks/use-guardian-tab-focus';

import type { SafeZone } from '@/types/safe-zone';

import { announceCheckInSafe, announceLiveAlert } from '@/utils/alert-speech';

import { isCheckInApiPaused } from '@/utils/check-in-api-pause';

type AlertsRealtimeContextValue = {
  refreshSeq: number;

  /** Active alert count from the shared poll (tab badge). */
  activeAlertCount: number;

  bumpRefresh: () => void;

  lastLiveAlert: AlertWsPayload | null;

  missingAlertModal: AlertWsPayload | null;

  openMissingChildAlert: (payload: AlertWsPayload) => void;

  dismissMissingChildAlert: () => void;

  /** Set when the device sends CHECK_IN_SAFE — closes pending check-in UI. */

  deviceSafeCheck: { childId: string; seq: number } | null;

};



const AlertsRealtimeContext = createContext<AlertsRealtimeContextValue | null>(null);



const ACTIVE_ALERT_POLL_MS = 90_000;

const ACTIVE_ALERT_POLL_FOCUSED_MS = 25_000;

const INITIAL_ALERT_POLL_DELAY_MS = 10_000;

const GEOFENCE_ANNOUNCE_COOLDOWN_MS = 20_000;



function normalizeAlertType(alertType: string) {

  return alertType.trim().toUpperCase().replace(/-/g, '_');

}



function isAnnounceableAlert(alertType: string) {

  const type = normalizeAlertType(alertType);

  return type === 'SOS' || type === 'GEOFENCE_BREACH' || type === 'CHILD_MISSING' || type === 'DANGER_ZONE_ENTRY' || type === 'SAFE_ZONE_ENTRY';

}



function isMissingChildAlert(alertType: string) {

  return normalizeAlertType(alertType) === 'CHILD_MISSING';

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

  const isForeground = useAppForeground();

  const isAlertsTabFocused = useIsGuardianTabFocused('alerts', 'home');

  const { children: guardianChildren, isLoading: guardianLoading } =
    useGuardianData();

  const alertsWsEnabled = isAuthenticated && isForeground && isAlertsTabFocused;

  const { lastAlert } = useAlertsWebSocket(user?.id, alertsWsEnabled);

  const [refreshSeq, setRefreshSeq] = useState(0);

  const [activeAlertCount, setActiveAlertCount] = useState(0);

  const [deviceSafeCheck, setDeviceSafeCheck] = useState<{ childId: string; seq: number } | null>(

    null,

  );

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [missingAlertModal, setMissingAlertModal] = useState<AlertWsPayload | null>(null);



  const spokenAlertIdsRef = useRef<Set<string>>(new Set());

  const seenCheckInIdsRef = useRef<Set<string>>(new Set());

  const alertsBaselineDoneRef = useRef(false);

  const sessionStartedAtRef = useRef(Date.now());

  const geofenceTrackRef = useRef<Map<string, GeofenceTrackState>>(new Map());

  const geofenceAnnounceAtRef = useRef<Map<string, number>>(new Map());

  const pollInFlightRef = useRef(false);



  const childNameById = useMemo(() => {

    const map = new Map<string, string>();

    for (const child of guardianChildren) map.set(child.id, child.name);

    return map;

  }, [guardianChildren]);



  const bumpRefresh = useCallback(() => {

    setRefreshSeq((value) => value + 1);

  }, []);



  const openMissingChildAlert = useCallback((payload: AlertWsPayload) => {

    setMissingAlertModal(payload);

  }, []);



  const dismissMissingChildAlert = useCallback(() => {

    setMissingAlertModal(null);

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

      const type = normalizeAlertType(alertType);



      if (type === 'GEOFENCE_BREACH') {

        return tryAnnounceGeofenceExit(childId, childName, zoneName, alertId);

      }



      if (type === 'DANGER_ZONE_ENTRY') {

        if (spokenAlertIdsRef.current.has(alertId)) return false;

        spokenAlertIdsRef.current.add(alertId);

        void announceLiveAlert(alertType, childName, zoneName ?? undefined);

        const zone = zoneName?.trim() || 'danger zone';

        setBannerMessage(`${childName} entered ${zone}`);

        bumpRefresh();

        return true;

      }



      if (type === 'SAFE_ZONE_ENTRY') {

        if (spokenAlertIdsRef.current.has(alertId)) return false;

        spokenAlertIdsRef.current.add(alertId);

        void announceLiveAlert(alertType, childName, zoneName ?? undefined);

        const zone = zoneName?.trim() || 'safe zone';

        setBannerMessage(`${childName} arrived at ${zone}`);

        bumpRefresh();

        return true;

      }



      if (type === 'CHILD_MISSING') {

        if (spokenAlertIdsRef.current.has(alertId)) return false;

        spokenAlertIdsRef.current.add(alertId);

        void announceLiveAlert(alertType, childName, zoneName ?? undefined);

        setBannerMessage(`Missing child — ${childName} reported missing`);

        bumpRefresh();

        return true;

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

      void announceCheckInSafe(childName);

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



      if (isMissingChildAlert(alert.alert_type)) {

        setMissingAlertModal({

          alert_id: alert.id,

          alert_type: alert.alert_type,

          child_id: alert.child_id,

          child_name: childNameById.get(alert.child_id),

          status: 'active',

          created_at: alert.created_at,

        });

      }

    },

    [announceAlert, handleQuietCheckInSafe, childNameById],

  );



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



    if (isMissingChildAlert(lastAlert.alert_type)) {

      setMissingAlertModal(lastAlert);

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
    if (pollInFlightRef.current || isCheckInApiPaused()) return;
    pollInFlightRef.current = true;

    try {
      const { alerts } = await alertsApi.getActiveAlerts();
      setActiveAlertCount(alerts.length);

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
        return;
      }

      for (const alert of alerts) {
        processAlertListItem(alert);
      }
    } catch {
      /* ignore transient network errors */
    } finally {
      pollInFlightRef.current = false;
    }
  }, [bumpRefresh, processAlertListItem]);



  useEffect(() => {
    if (!isAuthenticated || !isForeground) {
      alertsBaselineDoneRef.current = false;
      sessionStartedAtRef.current = Date.now();
      spokenAlertIdsRef.current.clear();
      seenCheckInIdsRef.current.clear();
      geofenceTrackRef.current.clear();
      geofenceAnnounceAtRef.current.clear();
      setActiveAlertCount(0);
      pollInFlightRef.current = false;
      return;
    }

    // Let /guardian/home finish first — avoids DB pool contention on cold start.
    if (guardianLoading) return;

    const pollMs = isAlertsTabFocused ? ACTIVE_ALERT_POLL_FOCUSED_MS : ACTIVE_ALERT_POLL_MS;

    const initialTimer = setTimeout(() => {
      void pollActiveAlerts();
    }, INITIAL_ALERT_POLL_DELAY_MS);

    const interval = setInterval(() => {
      void pollActiveAlerts();
    }, pollMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated, isForeground, guardianLoading, isAlertsTabFocused, pollActiveAlerts]);



  const value = useMemo(

    () => ({

      refreshSeq,

      activeAlertCount,

      bumpRefresh,

      lastLiveAlert: lastAlert,

      missingAlertModal,

      openMissingChildAlert,

      dismissMissingChildAlert,

      deviceSafeCheck,

    }),

    [

      refreshSeq,

      activeAlertCount,

      bumpRefresh,

      lastAlert,

      missingAlertModal,

      openMissingChildAlert,

      dismissMissingChildAlert,

      deviceSafeCheck,

    ],

  );



  const modalChild = useMemo(() => {

    if (!missingAlertModal) return undefined;

    const existing = guardianChildren.find((c) => c.id === missingAlertModal.child_id);

    if (existing) return existing;



    return {

      id: missingAlertModal.child_id,

      name: missingAlertModal.child_name ?? 'Child',

      age: 0,

      deviceLabel: 'Device',

      location:

        missingAlertModal.location_lat != null && missingAlertModal.location_lng != null

          ? `${missingAlertModal.location_lat.toFixed(4)}, ${missingAlertModal.location_lng.toFixed(4)}`

          : 'Location unknown',

      latitude: missingAlertModal.location_lat ?? 0,

      longitude: missingAlertModal.location_lng ?? 0,

      status: 'warning' as const,

      connectionStatus: 'offline' as const,

      lastUpdate: 'Just now',

      online: false,

      profilePhoto: missingAlertModal.image_url ?? undefined,

    };

  }, [guardianChildren, missingAlertModal]);

  const modalZones: SafeZone[] = [];



  return (

    <AlertsRealtimeContext.Provider value={value}>

      {children}

      {missingAlertModal && modalChild ? (

        <MissingChildAlertModal

          visible

          child={modalChild}

          alert={missingAlertModal}

          zones={modalZones}

          liveAddress={modalChild.location}

          onClose={dismissMissingChildAlert}

          onResolved={bumpRefresh}

        />

      ) : null}

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



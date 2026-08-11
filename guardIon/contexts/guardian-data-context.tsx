import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import * as childrenApi from '@/api/children';
import * as devicesApi from '@/api/devices';
import * as guardianApi from '@/api/guardian';
import * as locationsApi from '@/api/locations';
import { ApiError, getErrorMessage } from '@/api/errors';
import { applyDevicePollToChild, childCreatePayload, childSummaryFromApi } from '@/api/mappers';
import { setChildCustomAvatar } from '@/utils/child-custom-avatars';
import type { ChildResponse, DeviceResponse } from '@/api/types';
import type { RegisterChildPayload } from '@/components/guardian/add-child-modal';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { calculateAgeFromBirthDate } from '@/utils/child-age';
import { ensureHttpsProfilePhoto } from '@/lib/imagekit-upload';
import { applyLocationToChild } from '@/utils/apply-location-to-child';
import { isFreshCoordinateTimestamp } from '@/utils/device-online';
import { useAuth } from '@/contexts/auth-context';
import { useMultiLocationWebSocket } from '@/hooks/use-multi-location-websocket';
import { logApi, logApiError } from '@/utils/api-logger';

type RefreshOptions = {
  /** When true, keep showing cached children and skip blocking loaders. */
  background?: boolean;
  /** Skip background refresh debounce (after create/delete). */
  force?: boolean;
};

type GuardianDataContextValue = {
  children: ChildSummary[];
  /** True only on first load when no cached children exist yet. */
  isLoading: boolean;
  isRefreshing: boolean;
  /** Last load error message (empty list may mean fetch failed, not no children). */
  loadError: string | null;
  clearLoadError: () => void;
  /** Increments when live device GPS updates arrive (for alert polling). */
  locationTick: number;
  refreshChildren: (options?: RefreshOptions) => Promise<void>;
  getChildById: (id: string) => ChildSummary | undefined;
  registerChild: (payload: RegisterChildPayload) => Promise<ChildSummary>;
  updateChildProfile: (
    childId: string,
    payload: { name: string; age?: number | null; profile_photo?: string | null },
  ) => Promise<ChildSummary>;
  removeChild: (childId: string) => Promise<void>;
};

const DEVICE_STATUS_POLL_MS = 30_000;
const DEVICE_STATUS_POLL_LIVE_MS = 45_000;
const DEVICE_POLL_START_DELAY_MS = 5_000;
const BACKGROUND_REFRESH_MIN_MS = 30_000;

const GuardianDataContext = createContext<GuardianDataContextValue | null>(null);

async function fetchLocationSafely(childId: string) {
  try {
    return await locationsApi.getChildCurrentLocation(childId);
  } catch {
    return null;
  }
}

function mapChildren(
  apiChildren: ChildResponse[],
  devices: DeviceResponse[],
  options?: { includeLocation?: boolean },
) {
  const includeLocation = options?.includeLocation !== false;
  return Promise.all(
    apiChildren.map(async (child) => {
      const device = devices.find((d) => d.child_id === child.id) ?? null;
      const location = includeLocation ? await fetchLocationSafely(child.id) : null;
      return childSummaryFromApi(child, device, location);
    }),
  );
}

async function fetchChildrenAndDevices() {
  try {
    const home = await guardianApi.fetchGuardianHome();
    logApi(
      'guardian-data',
      `loaded home: ${home.children.length} children, ${home.devices.length} devices`,
    );
    return { apiChildren: home.children, devices: home.devices };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      logApi('guardian-data', 'fallback — /guardian/home missing, using separate API calls');
      const apiChildren = await childrenApi.listChildren();
      const devices = await devicesApi.listDevices();
      return { apiChildren, devices };
    }
    throw error;
  }
}

export function GuardianDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [childSummaries, setChildSummaries] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const childSummariesRef = useRef(childSummaries);
  childSummariesRef.current = childSummaries;
  const hasLoadedOnceRef = useRef(false);
  const pendingDeleteIdsRef = useRef<Set<string>>(new Set());
  const refreshInflightRef = useRef<Promise<void> | null>(null);
  const lastBackgroundRefreshRef = useRef(0);
  const devicePollInFlightRef = useRef(false);
  const childrenReadyRef = useRef(false);

  const [locationTick, setLocationTick] = useState(0);

  const deviceToChild = useMemo(() => {
    const map: Record<string, string> = {};
    for (const child of childSummaries) {
      if (child.deviceId) map[child.deviceId] = child.id;
    }
    return map;
  }, [
    childSummaries
      .map((child) => `${child.id}:${child.deviceId ?? ''}`)
      .sort()
      .join('|'),
  ]);

  const liveUpdates = useMultiLocationWebSocket(deviceToChild, isAuthenticated);
  const liveUpdatesRef = useRef(liveUpdates);
  liveUpdatesRef.current = liveUpdates;
  const hasLiveLocationRef = useRef(false);
  hasLiveLocationRef.current = Object.keys(liveUpdates).length > 0;

  useEffect(() => {
    if (!liveUpdates || Object.keys(liveUpdates).length === 0) return;

    let locationChanged = false;
    setChildSummaries((prev) => {
      const next = prev.map((child) => {
        const update = liveUpdates[child.id];
        if (update?.latitude == null || update?.longitude == null) return child;

        const signalAt = update.timestamp ?? child.coordinatesAt ?? null;
        const fresh = isFreshCoordinateTimestamp(signalAt);
        if (
          child.latitude === update.latitude &&
          child.longitude === update.longitude &&
          child.online === fresh &&
          child.connectionStatus === (fresh ? 'online' : child.connectionStatus) &&
          child.coordinatesAt === signalAt
        ) {
          return child;
        }

        locationChanged = true;
        return applyLocationToChild(child, update, fresh);
      });
      return locationChanged ? next : prev;
    });
    if (locationChanged) {
      setLocationTick((value) => value + 1);
    }
  }, [liveUpdates]);

  const pollDeviceStatus = useCallback(async () => {
    const current = childSummariesRef.current;
    if (!isAuthenticated || current.length === 0 || !childrenReadyRef.current) return;
    if (devicePollInFlightRef.current) return;
    devicePollInFlightRef.current = true;

    try {
      const devices = await devicesApi.listDevices();
      const skipLocationFetch = hasLiveLocationRef.current;
      const polled = await Promise.all(
        current.map(async (child) => {
          const device = devices.find((d) => d.child_id === child.id) ?? null;
          const location = skipLocationFetch ? null : await fetchLocationSafely(child.id);
          return applyDevicePollToChild(child, device, location);
        }),
      );
      const polledById = new Map(polled.map((child) => [child.id, child]));

      let locationChanged = false;
      setChildSummaries((prev) => {
        let changed = false;
        const next = prev.map((child) => {
          const updated = polledById.get(child.id);
          if (!updated) return child;

          const coordsChanged =
            child.online !== updated.online ||
            child.connectionStatus !== updated.connectionStatus ||
            child.coordinatesAt !== updated.coordinatesAt ||
            child.latitude !== updated.latitude ||
            child.longitude !== updated.longitude;

          if (coordsChanged) {
            locationChanged = true;
          }

          if (
            child.online === updated.online &&
            child.connectionStatus === updated.connectionStatus &&
            child.coordinatesAt === updated.coordinatesAt &&
            child.latitude === updated.latitude &&
            child.longitude === updated.longitude &&
            child.lastUpdate === updated.lastUpdate &&
            child.status === updated.status &&
            child.movement === updated.movement &&
            child.alertMessage === updated.alertMessage &&
            child.deviceId === updated.deviceId
          ) {
            return child;
          }

          changed = true;
          return updated;
        });

        return changed ? next : prev;
      });

      if (locationChanged) {
        setLocationTick((value) => value + 1);
      }
    } catch {
      /* keep last known state */
    } finally {
      devicePollInFlightRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || childSummaries.length === 0 || !hasLoadedOnceRef.current) return;

    const pollMs = hasLiveLocationRef.current
      ? DEVICE_STATUS_POLL_LIVE_MS
      : DEVICE_STATUS_POLL_MS;

    const startTimer = setTimeout(() => {
      void pollDeviceStatus();
    }, DEVICE_POLL_START_DELAY_MS);

    const interval = setInterval(() => {
      void pollDeviceStatus();
    }, pollMs);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated, childSummaries.length, pollDeviceStatus, liveUpdates]);

  const refreshChildren = useCallback(async (options?: RefreshOptions) => {
    if (!isAuthenticated) {
      setChildSummaries([]);
      setIsLoading(false);
      setIsRefreshing(false);
      hasLoadedOnceRef.current = false;
      childrenReadyRef.current = false;
      return;
    }

    const hasCached =
      childSummariesRef.current.length > 0 || hasLoadedOnceRef.current;
    const background = options?.background === true && hasCached;

    if (background && !options?.force) {
      const now = Date.now();
      if (now - lastBackgroundRefreshRef.current < BACKGROUND_REFRESH_MIN_MS) {
        return;
      }
      lastBackgroundRefreshRef.current = now;
    }

    if (refreshInflightRef.current) {
      return refreshInflightRef.current;
    }

    const run = async () => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { apiChildren, devices } = await fetchChildrenAndDevices();
        const pendingDeletes = pendingDeleteIdsRef.current;
        const visibleChildren = apiChildren.filter((child) => !pendingDeletes.has(child.id));
        const mapped = await mapChildren(visibleChildren, devices, { includeLocation: false });
        setChildSummaries(mapped);
        hasLoadedOnceRef.current = true;
        childrenReadyRef.current = true;
        setLoadError(null);
        logApi('guardian-data', `refresh ok — showing ${mapped.length} children`);
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Could not load children. Check your connection and try again.',
        );
        logApiError('guardian-data', 'refreshChildren failed', error);
        setLoadError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    const promise = run().finally(() => {
      refreshInflightRef.current = null;
    });
    refreshInflightRef.current = promise;
    return promise;
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshChildren();
  }, [refreshChildren]);

  const getChildById = useCallback(
    (id: string) => childSummaries.find((child) => child.id === id),
    [childSummaries],
  );

  const registerChild = useCallback(
    async (payload: RegisterChildPayload) => {
      const name = `${payload.firstName} ${payload.lastName}`.trim();
      logApi('guardian-data', `registerChild start — device ${payload.deviceId.trim()}`);
      try {
        const profilePhoto = payload.avatarUri
          ? await ensureHttpsProfilePhoto(payload.avatarUri, 'child')
          : null;
        const created = await childrenApi.createChild(
          childCreatePayload({
            name,
            age: calculateAgeFromBirthDate(payload.dateOfBirth),
            profile_photo: profilePhoto,
          }),
        );
        logApi('guardian-data', `registerChild created child ${created.id}`);

        const device = await devicesApi.registerDevice({
          device_id: payload.deviceId.trim(),
          child_id: created.id,
        });
        logApi('guardian-data', `registerChild linked device ${device.device_id}`);

        const summary = childSummaryFromApi(created, device, null);
        if (profilePhoto) {
          await setChildCustomAvatar(created.id, profilePhoto).catch(() => undefined);
        }
        setChildSummaries((prev) => [...prev, summary]);
        setLoadError(null);
        await refreshChildren({ background: true, force: true });
        return summary;
      } catch (error) {
        logApiError('guardian-data', 'registerChild failed', error);
        throw error;
      }
    },
    [refreshChildren],
  );

  const clearLoadError = useCallback(() => setLoadError(null), []);

  const updateChildProfile = useCallback(
    async (
      childId: string,
      payload: { name: string; age?: number | null; profile_photo?: string | null },
    ) => {
      const profilePhoto = payload.profile_photo
        ? await ensureHttpsProfilePhoto(payload.profile_photo, 'child')
        : payload.profile_photo ?? null;
      const updated = await childrenApi.updateChild(
        childId,
        childCreatePayload({ ...payload, profile_photo: profilePhoto }),
      );
      if (profilePhoto) {
        await setChildCustomAvatar(updated.id, profilePhoto).catch(() => undefined);
      }
      const devices = await devicesApi.listDevices();
      const device = devices.find((d) => d.child_id === updated.id) ?? null;
      const location = await fetchLocationSafely(updated.id);
      const summary = childSummaryFromApi(updated, device, location);
      setChildSummaries((prev) => prev.map((c) => (c.id === childId ? summary : c)));
      return summary;
    },
    [],
  );

  const removeChild = useCallback(async (childId: string) => {
    const snapshot = childSummariesRef.current.find((child) => child.id === childId);
    pendingDeleteIdsRef.current.add(childId);
    setChildSummaries((prev) => prev.filter((child) => child.id !== childId));

    try {
      await childrenApi.deleteChild(childId);
    } catch (error) {
      if (snapshot) {
        setChildSummaries((prev) => {
          if (prev.some((child) => child.id === childId)) return prev;
          return [...prev, snapshot];
        });
      } else {
        await refreshChildren({ background: true });
      }
      throw error;
    } finally {
      pendingDeleteIdsRef.current.delete(childId);
    }
  }, [refreshChildren]);

  const value = useMemo<GuardianDataContextValue>(
    () => ({
      children: childSummaries,
      isLoading,
      isRefreshing,
      loadError,
      clearLoadError,
      locationTick,
      refreshChildren,
      getChildById,
      registerChild,
      updateChildProfile,
      removeChild,
    }),
    [
      childSummaries,
      isLoading,
      isRefreshing,
      loadError,
      clearLoadError,
      locationTick,
      refreshChildren,
      getChildById,
      registerChild,
      updateChildProfile,
      removeChild,
    ],
  );

  return (
    <GuardianDataContext.Provider value={value}>{children}</GuardianDataContext.Provider>
  );
}

export function useGuardianData() {
  const ctx = useContext(GuardianDataContext);
  if (!ctx) throw new Error('useGuardianData must be used within GuardianDataProvider');
  return ctx;
}

export function useChildSummary(childId?: string | null) {
  const { getChildById, children, isLoading } = useGuardianData();
  const child = childId ? getChildById(childId) : undefined;
  return { child, children, isLoading };
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as childrenApi from '@/api/children';
import * as devicesApi from '@/api/devices';
import * as locationsApi from '@/api/locations';
import { childCreatePayload, childSummaryFromApi } from '@/api/mappers';
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

type GuardianDataContextValue = {
  children: ChildSummary[];
  isLoading: boolean;
  /** Increments when live device GPS updates arrive (for alert polling). */
  locationTick: number;
  refreshChildren: () => Promise<void>;
  getChildById: (id: string) => ChildSummary | undefined;
  registerChild: (payload: RegisterChildPayload) => Promise<ChildSummary>;
  updateChildProfile: (
    childId: string,
    payload: { name: string; age?: number | null; profile_photo?: string | null },
  ) => Promise<ChildSummary>;
  removeChild: (childId: string) => Promise<void>;
};

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
) {
  return Promise.all(
    apiChildren.map(async (child) => {
      const device = devices.find((d) => d.child_id === child.id) ?? null;
      const location = await fetchLocationSafely(child.id);
      return childSummaryFromApi(child, device, location);
    }),
  );
}

export function GuardianDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [childSummaries, setChildSummaries] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setChildSummaries((prev) => {
        let changed = false;
        const next = prev.map((child) => {
          const stillLive = isFreshCoordinateTimestamp(child.coordinatesAt);
          if (stillLive === child.online) return child;
          changed = true;
          return {
            ...child,
            online: stillLive,
            status: stillLive ? (child.alertMessage ? 'warning' : 'safe') : 'offline',
            movement: stillLive ? child.movement : 'Unknown',
            lastUpdate: stillLive
              ? child.lastUpdate
              : child.coordinatesAt
                ? child.lastUpdate
                : 'Unknown',
          };
        });
        return changed ? next : prev;
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const refreshChildren = useCallback(async () => {
    if (!isAuthenticated) {
      setChildSummaries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [apiChildren, devices] = await Promise.all([
        childrenApi.listChildren(),
        devicesApi.listDevices(),
      ]);
      const mapped = await mapChildren(apiChildren, devices);
      setChildSummaries(mapped);
    } catch {
      setChildSummaries([]);
    } finally {
      setIsLoading(false);
    }
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

      await devicesApi.registerDevice({
        device_id: payload.deviceId.trim(),
        child_id: created.id,
      });

      const [devices] = await Promise.all([devicesApi.listDevices()]);
      const device = devices.find((d) => d.child_id === created.id) ?? null;
      const location = await fetchLocationSafely(created.id);
      const summary = childSummaryFromApi(created, device, location);
      if (profilePhoto) {
        await setChildCustomAvatar(created.id, profilePhoto).catch(() => undefined);
      }
      setChildSummaries((prev) => [...prev, summary]);
      return summary;
    },
    [],
  );

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
    await childrenApi.deleteChild(childId);
    setChildSummaries((prev) => prev.filter((c) => c.id !== childId));
  }, []);

  const value = useMemo<GuardianDataContextValue>(
    () => ({
      children: childSummaries,
      isLoading,
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

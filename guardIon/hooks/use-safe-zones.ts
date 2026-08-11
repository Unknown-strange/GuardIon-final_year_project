import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import * as safezonesApi from '@/api/safezones';
import { safeZoneFromApi, safeZoneToCreate, safeZoneToUpdate } from '@/api/mappers';
import { useAuth } from '@/contexts/auth-context';
import type { SafeZone } from '@/types/safe-zone';
import { isCheckInApiPaused } from '@/utils/check-in-api-pause';

type SafeZoneInput = Omit<SafeZone, 'id'>;

export function useSafeZones(childId?: string | null, enabled = true) {
  const isFocused = useIsFocused();
  const { isAuthenticated } = useAuth();
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !childId || !enabled || isCheckInApiPaused()) {
      if (!enabled || !childId) {
        setZones([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const apiZones = await safezonesApi.listSafeZonesForChild(childId);
      setZones(apiZones.map(safeZoneFromApi));
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [childId, enabled, isAuthenticated]);

  useEffect(() => {
    if (!isFocused || !enabled) return;
    void refresh();
  }, [isFocused, enabled, refresh]);

  const childZones = useMemo(() => {
    if (!childId) return [];
    return zones.filter((zone) => zone.childId === childId);
  }, [childId, zones]);

  const addZone = useCallback(
    async (input: SafeZoneInput) => {
      if (!childId) throw new Error('Child is required to add a safe zone.');
      const created = await safezonesApi.createSafeZone(
        safeZoneToCreate({
          child_id: childId,
          zone_name: input.name,
          center_lat: input.latitude,
          center_lng: input.longitude,
          radius: input.radiusM,
          zone_type: input.zoneType,
        }),
      );
      const next = safeZoneFromApi(created);
      setZones((prev) => [...prev, next]);
      return next;
    },
    [childId],
  );

  const updateZone = useCallback(
    async (id: string, patch: Partial<Omit<SafeZone, 'id' | 'childId'>>) => {
      const updated = await safezonesApi.updateSafeZone(
        id,
        safeZoneToUpdate({
          zone_name: patch.name,
          center_lat: patch.latitude,
          center_lng: patch.longitude,
          radius: patch.radiusM,
          zone_type: patch.zoneType,
        }),
      );
      const mapped = safeZoneFromApi(updated);
      setZones((prev) => prev.map((zone) => (zone.id === id ? mapped : zone)));
    },
    [],
  );

  const deleteZone = useCallback(async (id: string) => {
    await safezonesApi.deleteSafeZone(id);
    setZones((prev) => prev.filter((zone) => zone.id !== id));
  }, []);

  return {
    zones,
    childZones,
    loading,
    refresh,
    addZone,
    updateZone,
    deleteZone,
  };
}

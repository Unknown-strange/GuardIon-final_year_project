export type ZoneType = 'safe' | 'danger';

export type SafeZoneSchedule = {
  start: string;
  end: string;
};

export type SafeZone = {
  id: string;
  childId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  zoneType: ZoneType;
  schedule?: SafeZoneSchedule | null;
  isActive?: boolean;
};

export const SAFE_ZONE_RADIUS_MIN = 2;
export const SAFE_ZONE_RADIUS_MAX = 1000;
export const SAFE_ZONE_RADIUS_DEFAULT = 15;

export function zoneTypeFromApi(value?: string | null): ZoneType {
  return value === 'DANGER' ? 'danger' : 'safe';
}

export function zoneTypeToApi(value: ZoneType): 'SAFE' | 'DANGER' {
  return value === 'danger' ? 'DANGER' : 'SAFE';
}

export function zoneColors(zoneType: ZoneType): { stroke: string; fill: string; muted: string } {
  if (zoneType === 'danger') {
    return { stroke: '#DC2626', fill: 'rgba(220, 38, 38, 0.18)', muted: '#FEE2E2' };
  }
  return { stroke: '#16A34A', fill: 'rgba(22, 163, 74, 0.18)', muted: '#DCFCE7' };
}

/** Map zoom level that frames a zone circle with padding. */
export function mapDeltaForZoneRadius(radiusM: number): number {
  const paddedDiameterM = Math.max(radiusM * 2.8, 12);
  const delta = paddedDiameterM / 111_000;
  return Math.min(0.05, Math.max(0.00025, delta));
}

export function isPointInZone(
  lat: number,
  lng: number,
  zone: Pick<SafeZone, 'latitude' | 'longitude' | 'radiusM'>,
): boolean {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const dLat = toRad(zone.latitude - lat);
  const dLng = toRad(zone.longitude - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(zone.latitude)) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * earthRadiusM * Math.asin(Math.sqrt(a));
  return distance <= zone.radiusM;
}

export function childGeofenceStatus(
  childLat: number,
  childLng: number,
  zones: SafeZone[],
): 'inside' | 'outside' | 'none' {
  const safeZones = zones.filter((zone) => zone.zoneType === 'safe');
  if (safeZones.length === 0) return 'none';
  const inside = safeZones.some((zone) => isPointInZone(childLat, childLng, zone));
  return inside ? 'inside' : 'outside';
}

export function childInsideSafeZoneName(
  childLat: number,
  childLng: number,
  zones: SafeZone[],
): string | null {
  const safeZones = zones.filter((zone) => zone.zoneType === 'safe');
  for (const zone of safeZones) {
    if (isPointInZone(childLat, childLng, zone)) {
      return zone.name;
    }
  }
  return null;
}

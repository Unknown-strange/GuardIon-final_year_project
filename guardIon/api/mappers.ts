import type { AlertResponse, ChildResponse, CurrentLocationResponse, DeviceResponse } from '@/api/types';
import type { AlertItem } from '@/constants/alerts-mocks';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import type { SafeZone, ZoneType } from '@/types/safe-zone';
import { zoneTypeFromApi, zoneTypeToApi } from '@/types/safe-zone';
import type { SafeZoneCreate, SafeZoneResponse, SafeZoneUpdate } from '@/api/types';
import {
  coordinatesTimestamp,
  isDeviceLiveFromCoords,
} from '@/utils/device-online';

const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.187;

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function childSummaryFromApi(
  child: ChildResponse,
  device?: DeviceResponse | null,
  location?: CurrentLocationResponse | null,
): ChildSummary {
  const online = isDeviceLiveFromCoords(device, location);
  const coordinatesAt = coordinatesTimestamp(location, device);

  const battery = device?.battery_level ?? location?.battery_level;
  const lowBattery = typeof battery === 'number' && battery <= 20;

  let status: ChildSummary['status'] = 'safe';
  if (!device || device.status === 'inactive' || device.status === 'lost' || !online) {
    status = 'offline';
  } else if (lowBattery) {
    status = 'warning';
  }

  return {
    id: child.id,
    name: child.name,
    age: child.age ?? 0,
    deviceLabel: device ? `Device · ${device.device_id}` : 'No device linked',
    deviceId: device?.device_id,
    location: location
      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      : 'Location unavailable',
    latitude: location?.latitude ?? DEFAULT_LAT,
    longitude: location?.longitude ?? DEFAULT_LNG,
    status,
    movement: online ? 'Active' : 'Unknown',
    lastUpdate: formatRelativeTime(coordinatesAt),
    online: !!online,
    coordinatesAt,
    alertMessage: lowBattery ? 'Low battery on device' : undefined,
    profilePhoto: child.profile_photo ?? undefined,
  };
}

function movementLabel(speed?: number | null): string {
  if (speed == null) return 'Active';
  return speed > 0.5 ? 'Moving' : 'Stationary';
}

export function applyDevicePollToChild(
  child: ChildSummary,
  device?: DeviceResponse | null,
  location?: CurrentLocationResponse | null,
): ChildSummary {
  const online = isDeviceLiveFromCoords(device, location);
  const coordinatesAt = coordinatesTimestamp(location, device);

  const battery = device?.battery_level ?? location?.battery_level;
  const lowBattery = typeof battery === 'number' && battery <= 20;

  let status: ChildSummary['status'] = 'safe';
  if (!device || device.status === 'inactive' || device.status === 'lost' || !online) {
    status = 'offline';
  } else if (lowBattery) {
    status = 'warning';
  }

  const hasLocation = location?.latitude != null && location?.longitude != null;

  return {
    ...child,
    deviceLabel: device ? `Device · ${device.device_id}` : child.deviceLabel,
    deviceId: device?.device_id ?? child.deviceId,
    location: hasLocation
      ? `${location!.latitude.toFixed(4)}, ${location!.longitude.toFixed(4)}`
      : child.location,
    latitude: hasLocation ? location!.latitude : child.latitude,
    longitude: hasLocation ? location!.longitude : child.longitude,
    status,
    movement: hasLocation ? movementLabel(location!.speed) : online ? child.movement : 'Unknown',
    lastUpdate: formatRelativeTime(coordinatesAt),
    online: !!online,
    coordinatesAt,
    alertMessage: lowBattery ? 'Low battery on device' : undefined,
  };
}

export function childCreatePayload(input: {
  name: string;
  age?: number | null;
  profile_photo?: string | null;
}) {
  return {
    name: input.name.trim(),
    age: input.age ?? null,
    profile_photo: input.profile_photo ?? null,
  };
}

export function safeZoneFromApi(zone: SafeZoneResponse): SafeZone {
  return {
    id: zone.id,
    childId: zone.child_id,
    name: zone.zone_name,
    latitude: zone.center_lat,
    longitude: zone.center_lng,
    radiusM: zone.radius,
    zoneType: zoneTypeFromApi(zone.zone_type),
    isActive: true,
  };
}

export function safeZoneToCreate(input: {
  child_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  zone_type?: ZoneType;
}): SafeZoneCreate {
  return {
    child_id: input.child_id,
    zone_name: input.zone_name.trim(),
    center_lat: input.center_lat,
    center_lng: input.center_lng,
    radius: input.radius,
    zone_type: zoneTypeToApi(input.zone_type ?? 'safe'),
  };
}

export function safeZoneToUpdate(patch: {
  zone_name?: string;
  center_lat?: number;
  center_lng?: number;
  radius?: number;
  zone_type?: ZoneType;
}): SafeZoneUpdate {
  const payload: SafeZoneUpdate = {};
  if (patch.zone_name !== undefined) payload.zone_name = patch.zone_name.trim();
  if (patch.center_lat !== undefined) payload.center_lat = patch.center_lat;
  if (patch.center_lng !== undefined) payload.center_lng = patch.center_lng;
  if (patch.radius !== undefined) payload.radius = patch.radius;
  if (patch.zone_type !== undefined) payload.zone_type = zoneTypeToApi(patch.zone_type);
  return payload;
}

function alertTitle(type: AlertResponse['alert_type']): string {
  switch (type) {
    case 'SOS':
      return 'Panic button SOS';
    case 'geofence_breach':
      return 'Geofence Exit';
    case 'check_in_safe':
      return 'Safe check-in';
    case 'low_battery':
      return 'Low battery';
    case 'device_offline':
      return 'Device offline';
    case 'device_tamper':
      return 'Device tamper';
    case 'child_missing':
      return 'Missing child alert';
    case 'danger_zone_entry':
      return 'Danger zone alert';
    case 'safe_zone_entry':
      return 'Safe zone arrival';
    default:
      return `${type}`.replace(/_/g, ' ');
  }
}

function alertBody(alert: AlertResponse, childName?: string): string {
  const name = childName ?? 'Child';
  switch (alert.alert_type) {
    case 'SOS':
      return `${name} pressed the panic button`;
    case 'check_in_safe':
      return `${name} confirmed they are safe (device check-in)`;
    case 'geofence_breach': {
      const zone = alert.zone_name?.trim() || 'safe zone';
      return `${name} left the ${zone} boundary`;
    }
    case 'low_battery':
      return `${name}'s device battery is low`;
    case 'device_offline':
      return `${name}'s device is offline`;
    case 'device_tamper':
      return `${name}'s device may have been tampered with`;
    case 'child_missing':
      return `${name} was reported missing by a guardian`;
    case 'danger_zone_entry': {
      const zone = alert.zone_name?.trim() || 'danger zone';
      return `${name} entered danger zone ${zone}`;
    }
    case 'safe_zone_entry': {
      const zone = alert.zone_name?.trim() || 'safe zone';
      return `${name} arrived at ${zone}`;
    }
    default:
      return `${alert.alert_type}`.replace(/_/g, ' ');
  }
}

function alertAccent(type: AlertResponse['alert_type']): AlertItem['accent'] {
  switch (type) {
    case 'SOS':
      return 'red';
    case 'geofence_breach':
      return 'yellow';
    case 'check_in_safe':
      return 'gray';
    case 'low_battery':
      return 'yellow';
    case 'child_missing':
      return 'red';
    case 'danger_zone_entry':
      return 'red';
    case 'safe_zone_entry':
      return 'gray';
    default:
      return 'gray';
  }
}

function alertUiType(type: AlertResponse['alert_type']): AlertItem['type'] {
  switch (type) {
    case 'SOS':
      return 'sos';
    case 'geofence_breach':
      return 'geofence';
    case 'check_in_safe':
      return 'check_in';
    case 'low_battery':
      return 'battery';
    case 'child_missing':
      return 'missing';
    case 'danger_zone_entry':
      return 'danger';
    case 'safe_zone_entry':
      return 'safe_zone';
    default:
      return 'system';
  }
}

export function alertFromApi(alert: AlertResponse, childName?: string): AlertItem {
  const location =
    alert.location_lat != null && alert.location_lng != null
      ? `${alert.location_lat.toFixed(4)}, ${alert.location_lng.toFixed(4)}`
      : undefined;

  return {
    id: alert.id,
    childId: alert.child_id,
    title:
      alert.alert_type === 'safe_zone_entry'
        ? `Arrived at ${alert.zone_name?.trim() || 'safe zone'}`
        : alertTitle(alert.alert_type),
    body: alertBody(alert, childName),
    time: formatRelativeTime(alert.created_at),
    accent: alertAccent(alert.alert_type),
    location,
    state: alert.status === 'resolved' ? 'resolved' : 'active',
    type: alertUiType(alert.alert_type),
    zoneName: alert.zone_name ?? undefined,
  };
}

export function historyItemFromLocation(input: {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  category?: 'location';
}) {
  return {
    id: input.id,
    title: input.title,
    sub: `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    time: formatRelativeTime(input.timestamp),
    category: input.category,
  };
}

import type { AlertResponse, ChildResponse, CurrentLocationResponse, DeviceResponse } from '@/api/types';
import type { AlertItem } from '@/constants/alerts-mocks';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import type { SafeZone } from '@/types/safe-zone';
import type { SafeZoneCreate, SafeZoneResponse, SafeZoneUpdate } from '@/api/types';

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
  const online =
    device?.status === 'active' &&
    (!device.last_seen || Date.now() - new Date(device.last_seen).getTime() < 15 * 60 * 1000);

  const battery = device?.battery_level ?? location?.battery_level;
  const lowBattery = typeof battery === 'number' && battery <= 20;

  let status: ChildSummary['status'] = 'safe';
  if (!device || device.status === 'inactive' || device.status === 'lost') {
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
    lastUpdate: formatRelativeTime(location?.timestamp ?? device?.last_seen),
    online: !!online,
    alertMessage: lowBattery ? 'Low battery on device' : undefined,
    profilePhoto: child.profile_photo ?? undefined,
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
    isActive: true,
  };
}

export function safeZoneToCreate(input: {
  child_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius: number;
}): SafeZoneCreate {
  return {
    child_id: input.child_id,
    zone_name: input.zone_name.trim(),
    center_lat: input.center_lat,
    center_lng: input.center_lng,
    radius: input.radius,
  };
}

export function safeZoneToUpdate(patch: {
  zone_name?: string;
  center_lat?: number;
  center_lng?: number;
  radius?: number;
}): SafeZoneUpdate {
  const payload: SafeZoneUpdate = {};
  if (patch.zone_name !== undefined) payload.zone_name = patch.zone_name.trim();
  if (patch.center_lat !== undefined) payload.center_lat = patch.center_lat;
  if (patch.center_lng !== undefined) payload.center_lng = patch.center_lng;
  if (patch.radius !== undefined) payload.radius = patch.radius;
  return payload;
}

function alertTitle(type: AlertResponse['alert_type']): string {
  switch (type) {
    case 'SOS':
      return 'SOS Alert';
    case 'geofence_breach':
      return 'Geofence breach';
    case 'low_battery':
      return 'Low battery';
    case 'device_offline':
      return 'Device offline';
    case 'device_tamper':
      return 'Device tamper';
    default:
      return 'Alert';
  }
}

function alertAccent(type: AlertResponse['alert_type']): AlertItem['accent'] {
  switch (type) {
    case 'SOS':
    case 'geofence_breach':
      return 'red';
    case 'low_battery':
      return 'yellow';
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
    case 'low_battery':
      return 'battery';
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
    title: alertTitle(alert.alert_type),
    body: childName ? `${childName} · ${alert.alert_type.replace(/_/g, ' ')}` : alert.alert_type.replace(/_/g, ' '),
    time: formatRelativeTime(alert.created_at),
    accent: alertAccent(alert.alert_type),
    location,
    state: alert.status === 'resolved' ? 'resolved' : 'active',
    type: alertUiType(alert.alert_type),
  };
}

export function historyItemFromLocation(input: {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}) {
  return {
    id: input.id,
    title: input.title,
    sub: `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    time: formatRelativeTime(input.timestamp),
  };
}

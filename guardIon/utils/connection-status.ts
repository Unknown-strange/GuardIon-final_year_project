import { isDeviceLiveFromCoords } from '@/utils/device-online';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

/** Grace period after child creation before showing offline. */
export const CONNECTING_GRACE_MS = 60_000;

type DeviceLike = {
  status?: string | null;
  last_seen?: string | null;
} | null | undefined;

type LocationLike = {
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | null;
} | null | undefined;

function isWithinConnectingGrace(childCreatedAt?: string | null): boolean {
  if (!childCreatedAt) return false;
  const createdMs = new Date(childCreatedAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs < CONNECTING_GRACE_MS;
}

export function resolveConnectionStatus(
  device: DeviceLike,
  location: LocationLike,
  childCreatedAt?: string | null,
): ConnectionStatus {
  if (isDeviceLiveFromCoords(device, location)) {
    return 'online';
  }

  if (isWithinConnectingGrace(childCreatedAt)) {
    return 'connecting';
  }

  return 'offline';
}

export function connectionStatusToBadgeVariant(
  connectionStatus: ConnectionStatus,
  lowBattery = false,
): 'connecting' | 'safe' | 'warning' | 'offline' {
  if (connectionStatus === 'connecting') return 'connecting';
  if (connectionStatus === 'offline') return 'offline';
  if (lowBattery) return 'warning';
  return 'safe';
}

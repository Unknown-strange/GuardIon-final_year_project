/** Coordinates must be newer than this to count as a live device. */
export const DEVICE_COORDINATES_FRESH_MS = 5 * 60 * 1000;

export function isFreshCoordinateTimestamp(iso?: string | null): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms < DEVICE_COORDINATES_FRESH_MS;
}

type DeviceLike = {
  status?: string | null;
  last_seen?: string | null;
} | null | undefined;

type LocationLike = {
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | null;
} | null | undefined;

function timestampMs(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** True when the backend recently received MQTT traffic from this device. */
export function isDeviceConnected(device: DeviceLike): boolean {
  if (!device || device.status === 'inactive' || device.status === 'lost') {
    return false;
  }
  return isFreshCoordinateTimestamp(device.last_seen);
}

/** Live when MQTT recently connected or GPS coordinates are fresh. */
export function isDeviceLiveFromCoords(device: DeviceLike, location: LocationLike): boolean {
  if (!device || device.status === 'inactive' || device.status === 'lost') {
    return false;
  }

  if (isDeviceConnected(device)) {
    return true;
  }

  const hasCoords = location?.latitude != null && location?.longitude != null;
  if (!hasCoords) {
    return false;
  }

  return isFreshCoordinateTimestamp(location.timestamp);
}

export function coordinatesTimestamp(
  location: LocationLike,
  device: DeviceLike,
): string | null {
  const locationMs = timestampMs(location?.timestamp);
  const lastSeenMs = timestampMs(device?.last_seen);

  if (locationMs != null && lastSeenMs != null) {
    return locationMs >= lastSeenMs ? location!.timestamp! : device!.last_seen!;
  }

  return location?.timestamp ?? device?.last_seen ?? null;
}

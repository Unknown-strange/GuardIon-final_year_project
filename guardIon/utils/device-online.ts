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

/** Live only when the backend recently reported GPS coordinates for this device. */
export function isDeviceLiveFromCoords(device: DeviceLike, location: LocationLike): boolean {
  if (!device || device.status === 'inactive' || device.status === 'lost') {
    return false;
  }

  const hasCoords = location?.latitude != null && location?.longitude != null;
  if (!hasCoords) {
    return false;
  }

  const signalAt = location?.timestamp ?? device.last_seen ?? null;
  return isFreshCoordinateTimestamp(signalAt);
}

export function coordinatesTimestamp(
  location: LocationLike,
  device: DeviceLike,
): string | null {
  return location?.timestamp ?? device?.last_seen ?? null;
}

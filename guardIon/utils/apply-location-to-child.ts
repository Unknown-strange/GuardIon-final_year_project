import type { LocationUpdate } from '@/hooks/use-location-websocket';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import type { CurrentLocationResponse } from '@/api/types';
import { formatRelativeTime } from '@/api/mappers';
import { connectionStatusToBadgeVariant } from '@/utils/connection-status';
import { isFreshCoordinateTimestamp } from '@/utils/device-online';

function movementLabel(speed?: number | null): string {
  if (speed == null) return 'Active';
  return speed > 0.5 ? 'Moving' : 'Stationary';
}

export function applyLocationToChild(
  child: ChildSummary,
  location: Pick<
    LocationUpdate | CurrentLocationResponse,
    'latitude' | 'longitude' | 'speed' | 'timestamp'
  >,
  live = false,
): ChildSummary {
  const coordinatesAt = location.timestamp ?? child.coordinatesAt ?? null;
  const online = isFreshCoordinateTimestamp(coordinatesAt);
  const connectionStatus = online ? 'online' : child.connectionStatus === 'connecting'
    ? 'connecting'
    : 'offline';

  return {
    ...child,
    latitude: location.latitude,
    longitude: location.longitude,
    location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    movement: movementLabel(location.speed),
    lastUpdate: live && online ? 'Live' : formatRelativeTime(coordinatesAt),
    online,
    connectionStatus,
    coordinatesAt,
    status: connectionStatusToBadgeVariant(
      connectionStatus,
      child.status === 'warning',
    ),
  };
}

import type { LocationUpdate } from '@/hooks/use-location-websocket';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import type { CurrentLocationResponse } from '@/api/types';
import { formatRelativeTime } from '@/api/mappers';

function movementLabel(speed?: number): string {
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
  return {
    ...child,
    latitude: location.latitude,
    longitude: location.longitude,
    location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    movement: movementLabel(location.speed),
    lastUpdate: live ? 'Live' : formatRelativeTime(location.timestamp ?? null),
    online: true,
  };
}

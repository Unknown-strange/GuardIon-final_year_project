import { apiRequest } from '@/api/client';
import type { CurrentLocationResponse, LocationHistoryResponse } from '@/api/types';

export function getDeviceCurrentLocation(deviceId: string) {
  return apiRequest<CurrentLocationResponse>(
    `/locations/${encodeURIComponent(deviceId)}/current`,
    { auth: true },
  );
}

export function getChildCurrentLocation(childId: string) {
  return apiRequest<CurrentLocationResponse>(`/locations/child/${childId}/current`, {
    auth: true,
  });
}

export function getDeviceLocationHistory(
  deviceId: string,
  params?: { start_time?: string; end_time?: string; limit?: number },
) {
  return apiRequest<LocationHistoryResponse>(
    `/locations/${encodeURIComponent(deviceId)}/history`,
    { auth: true, query: params },
  );
}

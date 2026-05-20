import { apiRequest } from '@/api/client';
import type { SafeZoneCreate, SafeZoneResponse, SafeZoneUpdate } from '@/api/types';

export function listSafeZonesForChild(childId: string) {
  return apiRequest<SafeZoneResponse[]>(`/safezones/child/${childId}`, { auth: true });
}

export function getSafeZone(safeZoneId: string) {
  return apiRequest<SafeZoneResponse>(`/safezones/${safeZoneId}`, { auth: true });
}

export function createSafeZone(payload: SafeZoneCreate) {
  return apiRequest<SafeZoneResponse>('/safezones/', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function updateSafeZone(safeZoneId: string, payload: SafeZoneUpdate) {
  return apiRequest<SafeZoneResponse>(`/safezones/${safeZoneId}`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export function deleteSafeZone(safeZoneId: string) {
  return apiRequest<void>(`/safezones/${safeZoneId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function checkLocationInSafeZone(
  safeZoneId: string,
  latitude: number,
  longitude: number,
) {
  return apiRequest<{
    is_within_safezone: boolean;
    safezone_id?: string | null;
    safezone_name?: string | null;
    distance_from_center?: number | null;
  }>(`/safezones/${safeZoneId}/check`, {
    method: 'POST',
    auth: true,
    body: { latitude, longitude },
  });
}

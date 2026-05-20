import { apiRequest } from '@/api/client';
import type { DeviceRegister, DeviceResponse, DeviceUpdate } from '@/api/types';

export function listDevices() {
  return apiRequest<DeviceResponse[]>('/devices/', { auth: true });
}

export function getDevice(deviceId: string) {
  return apiRequest<DeviceResponse>(`/devices/${encodeURIComponent(deviceId)}`, {
    auth: true,
  });
}

export function registerDevice(payload: DeviceRegister) {
  return apiRequest<DeviceResponse>('/devices/register', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function updateDevice(deviceId: string, payload: DeviceUpdate) {
  return apiRequest<DeviceResponse>(`/devices/${encodeURIComponent(deviceId)}`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export function deleteDevice(deviceId: string) {
  return apiRequest<void>(`/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
    auth: true,
  });
}

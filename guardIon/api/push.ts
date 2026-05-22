import { apiRequest } from '@/api/client';

export async function registerPushToken(payload: {
  token: string;
  platform?: string;
  device_name?: string;
}) {
  return apiRequest<{ id: string; token: string }>('/notifications/register-token', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

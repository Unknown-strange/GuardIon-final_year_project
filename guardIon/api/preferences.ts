import { apiRequest } from '@/api/client';

export type NotificationPreferences = {
  user_id: string;
  sos_enabled: boolean;
  geofence_enabled: boolean;
  battery_enabled: boolean;
  weekly_summary_enabled: boolean;
  updated_at: string;
};

export type UserSession = {
  id: string;
  device_name: string;
  platform?: string | null;
  last_active: string;
  created_at: string;
  is_current: boolean;
};

export async function getNotificationPreferences() {
  return apiRequest<NotificationPreferences>('/users/me/preferences', { auth: true });
}

export async function updateNotificationPreferences(payload: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>) {
  return apiRequest<NotificationPreferences>('/users/me/preferences', {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export async function listUserSessions() {
  return apiRequest<{ sessions: UserSession[] }>('/users/me/sessions', { auth: true });
}

export async function registerUserSession(payload: {
  device_name: string;
  platform?: string;
  user_agent?: string;
}) {
  return apiRequest<UserSession>('/users/me/sessions', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function revokeUserSession(sessionId: string) {
  return apiRequest<void>(`/users/me/sessions/${sessionId}`, {
    method: 'DELETE',
    auth: true,
  });
}

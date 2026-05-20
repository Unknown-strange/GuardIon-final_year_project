import { apiRequest } from '@/api/client';
import type { NotificationListResponse, NotificationResponse } from '@/api/types';

export function listNotifications(params?: { unread_only?: boolean; limit?: number }) {
  return apiRequest<NotificationListResponse>('/notifications/', {
    auth: true,
    query: params,
  });
}

export function markNotificationsRead(notificationIds: string[]) {
  return apiRequest<{ status: string; updated_count: number }>('/notifications/mark-read', {
    method: 'POST',
    auth: true,
    body: { notification_ids: notificationIds },
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ status: string; updated_count: number }>('/notifications/mark-all-read', {
    method: 'POST',
    auth: true,
  });
}

export function getNotification(notificationId: string) {
  return apiRequest<NotificationResponse>(`/notifications/${notificationId}`, { auth: true });
}

export function deleteNotification(notificationId: string) {
  return apiRequest<void>(`/notifications/${notificationId}`, {
    method: 'DELETE',
    auth: true,
  });
}

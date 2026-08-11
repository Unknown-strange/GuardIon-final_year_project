import { apiRequest } from '@/api/client';
import type { AlertListResponse, AlertResponse, AlertType } from '@/api/types';
import { dedupeInflight } from '@/utils/request-dedupe';

/** Coalesce parallel /alerts/active calls into one in-flight request. */
export function getActiveAlerts() {
  return dedupeInflight('alerts:active', () =>
    apiRequest<AlertListResponse>('/alerts/active', {
      auth: true,
      timeoutMs: 45000,
    }),
  );
}

export function getAlertHistory(params?: {
  alert_type?: AlertType;
  start_time?: string;
  end_time?: string;
  limit?: number;
}) {
  return apiRequest<AlertListResponse>('/alerts/history', {
    auth: true,
    query: params,
    timeoutMs: 45000,
  });
}

export function getChildActiveAlerts(childId: string) {
  return apiRequest<AlertListResponse>(`/alerts/child/${childId}/active`, { auth: true });
}

export function getAlert(alertId: string) {
  return apiRequest<AlertResponse>(`/alerts/${alertId}`, { auth: true });
}

export function acknowledgeAlert(alertId: string, responseText?: string) {
  return apiRequest<AlertResponse>(`/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    auth: true,
    body: { response_text: responseText ?? null },
  });
}

export function resolveAlert(alertId: string, responseText?: string) {
  return apiRequest<AlertResponse>(`/alerts/${alertId}/resolve`, {
    method: 'POST',
    auth: true,
    body: { response_text: responseText ?? null },
  });
}

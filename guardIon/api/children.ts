import { apiRequest } from '@/api/client';
import type { AlertResponse, ChildCreate, ChildResponse, ChildUpdate } from '@/api/types';

export type ReportMissingChildRequest = {
  notes?: string | null;
  last_seen_description?: string | null;
  use_device_location?: boolean;
};

export function listOwnedChildren() {
  return apiRequest<ChildResponse[]>('/children/owned', { auth: true });
}

export function reportMissingChild(childId: string, payload: ReportMissingChildRequest = {}) {
  return apiRequest<{ alert: AlertResponse; guardians_notified: number }>(
    `/children/${childId}/report-missing`,
    {
      method: 'POST',
      auth: true,
      body: payload,
    },
  );
}

export function listChildren() {
  return apiRequest<ChildResponse[]>('/children/', { auth: true, timeoutMs: 45000 });
}

export function getChild(childId: string) {
  return apiRequest<ChildResponse>(`/children/${childId}`, { auth: true });
}

export function createChild(payload: ChildCreate) {
  return apiRequest<ChildResponse>('/children/', {
    method: 'POST',
    auth: true,
    body: payload,
    timeoutMs: 60000,
  });
}

export function updateChild(childId: string, payload: ChildUpdate) {
  return apiRequest<ChildResponse>(`/children/${childId}`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export function deleteChild(childId: string) {
  return apiRequest<void>(`/children/${childId}`, {
    method: 'DELETE',
    auth: true,
    timeoutMs: 60000,
  });
}

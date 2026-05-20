import { apiRequest } from '@/api/client';
import type { ChildCreate, ChildResponse, ChildUpdate } from '@/api/types';

export function listChildren() {
  return apiRequest<ChildResponse[]>('/children/', { auth: true });
}

export function getChild(childId: string) {
  return apiRequest<ChildResponse>(`/children/${childId}`, { auth: true });
}

export function createChild(payload: ChildCreate) {
  return apiRequest<ChildResponse>('/children/', {
    method: 'POST',
    auth: true,
    body: payload,
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
  });
}

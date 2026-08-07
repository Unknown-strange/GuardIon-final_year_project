import { apiRequest } from '@/api/client';

export type CheckInResponse = {
  id: string;
  child_id: string;
  status: 'pending' | 'confirmed' | 'timeout' | 'cancelled';
  requested_at: string;
  confirmed_at?: string | null;
};

export async function requestCheckIn(childId: string) {
  return apiRequest<CheckInResponse>('/check-ins/', {
    method: 'POST',
    auth: true,
    body: { child_id: childId },
  });
}

export async function getCheckIn(checkInId: string) {
  return apiRequest<CheckInResponse>(`/check-ins/${checkInId}`, { auth: true });
}

export async function timeoutCheckIn(checkInId: string) {
  return apiRequest<CheckInResponse>(`/check-ins/${checkInId}/timeout`, {
    method: 'POST',
    auth: true,
  });
}

export async function cancelCheckIn(checkInId: string) {
  return apiRequest<CheckInResponse>(`/check-ins/${checkInId}/cancel`, {
    method: 'POST',
    auth: true,
  });
}

export async function getLatestCheckIn(childId: string) {
  return apiRequest<CheckInResponse>(`/check-ins/child/${childId}/latest`, { auth: true });
}

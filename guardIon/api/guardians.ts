import { apiRequest } from '@/api/client';

export type GuardianMemberResponse = {
  id: string;
  child_id: string;
  name: string;
  email: string;
  role: string;
  is_primary?: boolean;
  status?: 'active' | 'pending';
};

export async function listGuardians(childId?: string) {
  return apiRequest<{ guardians: GuardianMemberResponse[] }>('/guardians/', {
    auth: true,
    query: childId ? { child_id: childId } : undefined,
  });
}

export async function inviteGuardian(payload: { child_id: string; email: string; priority?: number }) {
  return apiRequest<GuardianMemberResponse>('/guardians/', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function removeGuardian(guardianId: string) {
  return apiRequest<void>(`/guardians/${guardianId}`, {
    method: 'DELETE',
    auth: true,
  });
}

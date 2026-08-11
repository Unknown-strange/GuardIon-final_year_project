import { apiRequest } from '@/api/client';
import { dedupeInflight } from '@/utils/request-dedupe';

export type GuardianMemberResponse = {
  id: string;
  child_id: string;
  name: string;
  email: string;
  role: string;
  is_primary?: boolean;
  status?: 'active' | 'pending';
};

export type GuardianInviteResponse = {
  id: string;
  child_id: string;
  child_name: string;
  invited_by_name: string;
  invited_by_email: string;
  status: 'pending';
};

export async function listPendingInvites() {
  return dedupeInflight('guardians:invites', () =>
    apiRequest<{ invites: GuardianInviteResponse[] }>('/guardians/invites', {
      auth: true,
      timeoutMs: 45000,
    }),
  );
}

export async function acceptGuardianInvite(guardianId: string) {
  return apiRequest<GuardianMemberResponse>(`/guardians/${guardianId}/accept`, {
    method: 'POST',
    auth: true,
  });
}

export async function declineGuardianInvite(guardianId: string) {
  return apiRequest<void>(`/guardians/${guardianId}/decline`, {
    method: 'POST',
    auth: true,
  });
}

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

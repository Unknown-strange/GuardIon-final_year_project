import { apiRequest } from '@/api/client';
import { dedupeInflight } from '@/utils/request-dedupe';

export type EmergencyContactResponse = {
  id: string;
  child_id: string;
  name: string;
  phone: string;
  relationship?: string | null;
  created_at: string;
};

export async function listEmergencyContacts(childId?: string) {
  const key = `emergency-contacts:${childId ?? 'all'}`;
  return dedupeInflight(key, () =>
    apiRequest<{ contacts: EmergencyContactResponse[] }>('/emergency-contacts/', {
      auth: true,
      query: childId ? { child_id: childId } : undefined,
    }),
  );
}

export async function createEmergencyContact(payload: {
  child_id: string;
  name: string;
  phone: string;
  relationship?: string;
}) {
  return apiRequest<EmergencyContactResponse>('/emergency-contacts/', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function updateEmergencyContact(
  contactId: string,
  payload: { name?: string; phone?: string; relationship?: string },
) {
  return apiRequest<EmergencyContactResponse>(`/emergency-contacts/${contactId}`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

export async function deleteEmergencyContact(contactId: string) {
  return apiRequest<void>(`/emergency-contacts/${contactId}`, {
    method: 'DELETE',
    auth: true,
  });
}

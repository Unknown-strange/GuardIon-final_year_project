import { useCallback, useEffect, useState } from 'react';

import * as emergencyContactsApi from '@/api/emergency-contacts';
import type { EmergencyContactResponse } from '@/api/emergency-contacts';
import { useAuth } from '@/contexts/auth-context';
import type { ChildContact } from '@/types/child-contact';

export function mapEmergencyContactToChildContact(
  contact: EmergencyContactResponse,
): ChildContact {
  return {
    id: contact.id,
    childId: contact.child_id,
    name: contact.name,
    phone: contact.phone,
    role: contact.relationship?.trim() ?? '',
    type: 'guardian',
  };
}

export function useEmergencyContacts(childId?: string | null, enabled = true) {
  const { isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<ChildContact[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !enabled) {
      setContacts([]);
      return;
    }

    setLoading(true);
    try {
      const res = await emergencyContactsApi.listEmergencyContacts(
        childId?.trim() ? childId : undefined,
      );
      setContacts(res.contacts.map(mapEmergencyContactToChildContact));
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [childId, enabled, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { contacts, loading, refresh };
}

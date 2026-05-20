import type { ChildContact } from '@/types/child-contact';

const BASE_CONTACTS: Omit<ChildContact, 'childId'>[] = [
  {
    id: 'mom',
    name: 'Sarah (Mom)',
    role: 'Primary guardian',
    phone: '+233241234567',
    type: 'guardian',
    isPrimary: true,
  },
  {
    id: 'dad',
    name: 'James (Dad)',
    role: 'Secondary guardian',
    phone: '+233209876543',
    type: 'guardian',
  },
  {
    id: 'school',
    name: "St. Mary's School",
    role: 'School office',
    phone: '+233302123456',
    type: 'school',
  },
  {
    id: 'police',
    name: 'Emergency — Police (191)',
    role: 'Ghana emergency',
    phone: '191',
    type: 'emergency',
  },
];

export const MOCK_CHILD_CONTACTS: ChildContact[] = ['1', '2', '3'].flatMap((childId) =>
  BASE_CONTACTS.map((c) => ({
    ...c,
    childId,
    id: `${childId}-${c.id}`,
  })),
);

export function getContactsForChild(childId: string): ChildContact[] {
  return MOCK_CHILD_CONTACTS.filter((c) => c.childId === childId);
}

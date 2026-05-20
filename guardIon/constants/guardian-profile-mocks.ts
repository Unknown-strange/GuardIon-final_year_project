export type GuardianProfile = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

export const GUARDIAN_PROFILE: GuardianProfile = {
  name: 'Robert Anderson',
  email: 'sarah.m@email.com',
  role: 'Primary Guardian',
  initials: 'RA',
};

export type GuardianMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimary?: boolean;
  avatarColor?: string;
  status?: 'active' | 'pending';
};

export const MOCK_GUARDIANS: GuardianMember[] = [
  {
    id: '1',
    name: 'Robert Anderson',
    email: 'robert.a@securemail.com',
    role: 'Primary Guardian',
    isPrimary: true,
    avatarColor: '#072B59',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Mitchell',
    email: 'sarah.m@securemail.com',
    role: 'Secondary Guardian',
    avatarColor: '#0D9488',
    status: 'active',
  },
  {
    id: '3',
    name: 'James Anderson',
    email: 'james.a@securemail.com',
    role: 'Secondary Guardian',
    avatarColor: '#2563EB',
    status: 'active',
  },
];

export function getGuardianInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

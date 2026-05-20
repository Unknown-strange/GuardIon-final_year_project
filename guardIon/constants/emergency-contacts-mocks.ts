export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatarColor?: string;
};

export const MOCK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    relationship: 'Aunt',
    phone: '+233241234567',
    avatarColor: '#0D9488',
  },
  {
    id: '2',
    name: 'James Wilson',
    relationship: 'Uncle',
    phone: '+233209876543',
    avatarColor: '#2563EB',
  },
  {
    id: '3',
    name: 'Dr. Ama Serwaa',
    relationship: 'Family doctor',
    phone: '+233302123456',
    avatarColor: '#7C3AED',
  },
];

export function getEmergencyContactInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export type LoggedInDevice = {
  id: string;
  name: string;
  platform: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export const MOCK_LOGGED_IN_DEVICES: LoggedInDevice[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    platform: 'iOS · GuardIon app',
    location: 'Accra, Ghana',
    lastActive: 'Active now',
    isCurrent: true,
  },
  {
    id: '2',
    name: 'Chrome on Windows',
    platform: 'Web browser',
    location: 'Kumasi, Ghana',
    lastActive: '2 days ago',
    isCurrent: false,
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24',
    platform: 'Android · GuardIon app',
    location: 'Tema, Ghana',
    lastActive: '1 week ago',
    isCurrent: false,
  },
];

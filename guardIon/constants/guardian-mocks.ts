import type { ChildSummary } from '@/components/guardian/child-summary-card';

export const MOCK_CHILDREN: ChildSummary[] = [
  {
    id: '1',
    name: 'Ama Mensah',
    age: 7,
    deviceLabel: 'Device · GW-7842',
    deviceId: 'GW-7842',
    gender: 'female',
    dateOfBirth: '2018-03-15',
    location: "St. Mary's School",
    latitude: 5.6115,
    longitude: -0.182,
    status: 'safe',
    movement: 'Stationary',
    lastUpdate: '2 mins ago',
    online: true,
  },
  {
    id: '2',
    name: 'Kofi Asante',
    age: 9,
    deviceLabel: 'Device · SW-9921',
    deviceId: 'SW-9921',
    gender: 'male',
    dateOfBirth: '2016-07-20',
    location: 'Home zone',
    latitude: 5.6037,
    longitude: -0.187,
    status: 'warning',
    movement: 'Moving',
    lastUpdate: '1 min ago',
    online: true,
    alertMessage: 'Leaving safe zone (Home)',
  },
  {
    id: '3',
    name: 'Ama Adjei',
    age: 7,
    deviceLabel: 'Device · LB-3301',
    deviceId: 'LB-3301',
    gender: 'female',
    dateOfBirth: '2018-11-02',
    location: "St. Mary's School",
    latitude: 5.6088,
    longitude: -0.1755,
    status: 'offline',
    movement: '? Unknown',
    lastUpdate: '26 mins ago',
    online: false,
  },
];

export function getChildSummary(id: string): ChildSummary {
  return MOCK_CHILDREN.find((c) => c.id === id) ?? MOCK_CHILDREN[0];
}

export function getChildAge(id: string): number {
  return getChildSummary(id).age;
}

export type MiaDashboard = {
  childName: string;
  age: number;
  tagline: string;
  liveAddress: string;
  liveUpdated: string;
  riskLabel: string;
  riskPercent: number;
};

export function getChildDashboard(id: string): MiaDashboard {
  const base = getChildSummary(id);
  return {
    childName: base.name,
    age: getChildAge(id),
    tagline: 'Guardian Protected',
    liveAddress: base.location,
    liveUpdated: base.lastUpdate,
    riskLabel: base.status === 'warning' ? 'Elevated' : base.status === 'offline' ? 'Unknown' : 'Low Risk',
    riskPercent: base.status === 'warning' ? 28 : base.status === 'offline' ? 45 : 5,
  };
}
import type { ChildSummary } from '@/components/guardian/child-summary-card';

export const MOCK_CHILDREN: ChildSummary[] = [
  {
    id: '1',
    name: 'Ama',
    deviceLabel: 'Wearable · Tracker',
    location: "St. Mary's School",
    status: 'safe',
    movement: 'Stationary',
    lastUpdate: '2 mins ago',
    online: true,
  },
  {
    id: '2',
    name: 'Kofi',
    deviceLabel: 'Smartwatch',
    location: 'Home zone',
    status: 'warning',
    movement: 'Moving',
    lastUpdate: '1 min ago',
    online: true,
    alertMessage: 'Leaving safe zone (Home)',
  },
  {
    id: '3',
    name: 'Ama',
    deviceLabel: 'Legacy band',
    location: "St. Mary's School",
    status: 'offline',
    movement: '? Unknown',
    lastUpdate: '26 mins ago',
    online: false,
  },
];

export function getChildSummary(id: string): ChildSummary {
  return MOCK_CHILDREN.find((c) => c.id === id) ?? MOCK_CHILDREN[0];
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
    childName: base.name === 'Kofi' ? 'Kofi' : 'Mia',
    age: base.name === 'Kofi' ? 9 : 7,
    tagline: 'Guardian Protected',
    liveAddress: 'Acora',
    liveUpdated: '1m ago',
    riskLabel: base.status === 'warning' ? 'Elevated' : 'Low Risk',
    riskPercent: base.status === 'warning' ? 28 : 5,
  };
}
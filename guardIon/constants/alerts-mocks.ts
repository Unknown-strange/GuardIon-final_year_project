import { getChildSummary } from '@/constants/guardian-mocks';

export type AlertItem = {
  id: string;
  childId: string;
  title: string;
  body: string;
  time: string;
  accent: 'red' | 'yellow' | 'gray';
  location?: string;
  state: 'active' | 'resolved';
  type?: 'sos' | 'geofence' | 'check_in' | 'system' | 'battery' | 'missing' | 'danger' | 'safe_zone';
  zoneName?: string;
};

function childName(childId: string) {
  return getChildSummary(childId).name;
}

function deviceLabel(childId: string) {
  return getChildSummary(childId).deviceLabel;
}

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    childId: '1',
    title: 'SOS Signal Activated',
    body: `Manual trigger from ${childName('1')}'s ${deviceLabel('1')}`,
    time: '2m ago',
    accent: 'red',
    location: "Near St. Mary's School, Accra",
    state: 'active',
    type: 'sos',
  },
  {
    id: '2',
    childId: '2',
    title: 'Geofence Exit',
    body: `${childName('2')} left the Home zone boundary`,
    time: '45m ago',
    accent: 'yellow',
    location: 'Home zone · East Legon',
    state: 'active',
    type: 'geofence',
  },
  {
    id: '3',
    childId: '1',
    title: 'Device is now charging',
    body: `${childName('1')}'s tracker connected to charger`,
    time: '1h ago',
    accent: 'gray',
    state: 'resolved',
    type: 'system',
  },
  {
    id: '4',
    childId: '2',
    title: 'Low Battery Warning',
    body: `${childName('2')}'s smartwatch at 12%`,
    time: '3h ago',
    accent: 'gray',
    state: 'resolved',
    type: 'battery',
  },
  {
    id: '5',
    childId: '3',
    title: 'Device Offline',
    body: `${childName('3')}'s legacy band lost connection`,
    time: '26m ago',
    accent: 'yellow',
    state: 'active',
    type: 'system',
  },
  {
    id: '6',
    childId: '3',
    title: 'Geofence Entry',
    body: `${childName('3')} entered School zone`,
    time: '2d ago',
    accent: 'gray',
    state: 'resolved',
    type: 'geofence',
  },
];

export function getAlertsForChild(childId: string | null): AlertItem[] {
  if (!childId) return MOCK_ALERTS;
  return MOCK_ALERTS.filter((a) => a.childId === childId);
}

export function getActiveAlertCount(childId: string | null): number {
  return getAlertsForChild(childId).filter((a) => a.state === 'active').length;
}

export function getActiveAlertCountsByChild(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of MOCK_ALERTS) {
    if (alert.state !== 'active') continue;
    counts[alert.childId] = (counts[alert.childId] ?? 0) + 1;
  }
  return counts;
}

export function getSosTargetChildId(selectedChildId: string | null): string {
  if (selectedChildId) return selectedChildId;
  const sos = MOCK_ALERTS.find((a) => a.state === 'active' && a.type === 'sos');
  return sos?.childId ?? '1';
}

export function getContactsChildId(selectedChildId: string | null): string {
  if (selectedChildId) return selectedChildId;
  const active = MOCK_ALERTS.find((a) => a.state === 'active');
  return active?.childId ?? '1';
}

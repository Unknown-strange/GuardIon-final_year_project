import { DEFAULT_MAP_LOCATION } from '@/constants/theme';
import type { SafeZone } from '@/types/safe-zone';

export const DEMO_SAFE_ZONES: SafeZone[] = [
  {
    id: 'demo-home-1',
    childId: '1',
    name: 'Home',
    address: 'Kumasi, Ashanti',
    latitude: DEFAULT_MAP_LOCATION.latitude,
    longitude: DEFAULT_MAP_LOCATION.longitude,
    radiusM: 200,
    zoneType: 'safe',
    schedule: null,
    isActive: true,
  },
  {
    id: 'demo-school-1',
    childId: '1',
    name: 'School',
    address: 'KNUST Campus, Kumasi',
    latitude: 6.6785,
    longitude: -1.5712,
    radiusM: 350,
    zoneType: 'safe',
    schedule: { start: '08:00', end: '15:00' },
  },
  {
    id: 'demo-home-2',
    childId: '2',
    name: 'Home',
    address: 'Kumasi, Ashanti',
    latitude: DEFAULT_MAP_LOCATION.latitude,
    longitude: DEFAULT_MAP_LOCATION.longitude,
    radiusM: 200,
    zoneType: 'safe',
    schedule: null,
    isActive: true,
  },
  {
    id: 'demo-park-2',
    childId: '2',
    name: 'Park',
    address: 'Rattray Park, Kumasi',
    latitude: 6.6652,
    longitude: -1.5589,
    radiusM: 150,
    zoneType: 'safe',
    schedule: { start: '16:00', end: '18:00' },
  },
  {
    id: 'demo-home-3',
    childId: '3',
    name: 'Home',
    address: 'Adum, Kumasi',
    latitude: 6.6881,
    longitude: -1.6244,
    radiusM: 250,
    zoneType: 'safe',
    schedule: null,
    isActive: true,
  },
];

export function getDemoZonesForChild(childId: string): SafeZone[] {
  return DEMO_SAFE_ZONES.filter((zone) => zone.childId === childId);
}

export function formatZoneSchedule(zone: Pick<SafeZone, 'schedule'>): string {
  if (!zone.schedule) return 'Always Active';
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
  };
  return `Mon–Fri, ${fmt(zone.schedule.start)}–${fmt(zone.schedule.end)}`;
}

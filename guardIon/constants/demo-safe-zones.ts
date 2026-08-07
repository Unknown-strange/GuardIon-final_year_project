import type { SafeZone } from '@/types/safe-zone';

export const DEMO_SAFE_ZONES: SafeZone[] = [
  {
    id: 'demo-home-1',
    childId: '1',
    name: 'Home',
    address: '14 Independence Ave, Accra',
    latitude: 5.6037,
    longitude: -0.187,
    radiusM: 200,
    zoneType: 'safe',
    schedule: null,
    isActive: true,
  },
  {
    id: 'demo-school-1',
    childId: '1',
    name: 'School',
    address: "St. Mary's School, East Legon",
    latitude: 5.6115,
    longitude: -0.182,
    radiusM: 350,
    zoneType: 'safe',
    schedule: { start: '08:00', end: '15:00' },
  },
  {
    id: 'demo-home-2',
    childId: '2',
    name: 'Home',
    address: '22 Ring Road Central, Accra',
    latitude: 5.6037,
    longitude: -0.187,
    radiusM: 200,
    zoneType: 'safe',
    schedule: null,
    isActive: true,
  },
  {
    id: 'demo-park-2',
    childId: '2',
    name: 'Park',
    address: 'Legon Botanical Gardens',
    latitude: 5.6501,
    longitude: -0.1867,
    radiusM: 150,
    zoneType: 'safe',
    schedule: { start: '16:00', end: '18:00' },
  },
  {
    id: 'demo-home-3',
    childId: '3',
    name: 'Home',
    address: '8 Oxford Street, Osu',
    latitude: 5.6088,
    longitude: -0.1755,
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

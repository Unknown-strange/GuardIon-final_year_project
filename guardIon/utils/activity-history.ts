import type { ActivityItemResponse, ActivityStatsResponse, AlertType } from '@/api/types';
import { formatRelativeTime } from '@/api/mappers';

export type ActivityStatus = 'safe' | 'warning' | 'danger';

export type ActivityCategory =
  | 'alert'
  | 'movement'
  | 'check_in'
  | 'safe_zone'
  | 'danger_zone';

export type HistoryFilter = 'all' | 'alerts' | 'movement' | 'check_ins' | 'zones';

export type HistoryDayKey = string;

export type ActivityHistoryItem = {
  id: string;
  kind: 'alert' | 'location';
  category: ActivityCategory;
  title: string;
  body: string;
  timestamp: string;
  timeLabel: string;
  relativeTime: string;
  childId?: string;
  childName?: string;
  latitude?: number;
  longitude?: number;
  status: ActivityStatus;
  alertType?: AlertType;
};

export type ActivityHistoryStats = {
  safeZonesVisited: number;
  checkInsCompleted: number;
  alertsTriggered: number;
  timeActiveLabel: string;
  lastLocationLabel: string;
};

export function toDayKey(date: Date): HistoryDayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayKeyToDate(dayKey: HistoryDayKey): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function todayDayKey(): HistoryDayKey {
  return toDayKey(new Date());
}

export function buildRecentDayKeys(count = 7): HistoryDayKey[] {
  const keys: HistoryDayKey[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(toDayKey(d));
  }
  return keys;
}

export function dayRangeBounds(dayKey: HistoryDayKey): { start: string; end: string } {
  const start = dayKeyToDate(dayKey);
  start.setHours(0, 0, 0, 0);
  const end = dayKeyToDate(dayKey);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatDayLabel(isoOrDate: string | Date, ref = new Date()): string {
  const date =
    typeof isoOrDate === 'string' && isoOrDate.length === 10
      ? dayKeyToDate(isoOrDate)
      : typeof isoOrDate === 'string'
        ? new Date(isoOrDate)
        : isoOrDate;

  if (Number.isNaN(date.getTime())) return '—';

  const targetKey = toDayKey(date);
  const refKey = toDayKey(ref);

  const tomorrow = new Date(ref);
  tomorrow.setDate(ref.getDate() + 1);
  const yesterday = new Date(ref);
  yesterday.setDate(ref.getDate() - 1);

  if (targetKey === refKey) return 'Today';
  if (targetKey === toDayKey(tomorrow)) return 'Tomorrow';
  if (targetKey === toDayKey(yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function activityPageTitle(dayKey: HistoryDayKey): string {
  const label = formatDayLabel(dayKey);
  if (label === 'Today') return "Today's Activity";
  if (label === 'Yesterday') return "Yesterday's Activity";
  if (label === 'Tomorrow') return "Tomorrow's Activity";
  return `${label} Activity`;
}

export function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatEventTimeLabel(iso: string, ref = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const time = formatClockTime(iso);
  const dayLabel = formatDayLabel(date, ref);
  if (dayLabel === 'Today' || dayLabel === 'Tomorrow' || dayLabel === 'Yesterday') {
    return time;
  }
  const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${shortDate} · ${time}`;
}

export function matchesDayKey(iso: string, dayKey: HistoryDayKey): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return toDayKey(date) === dayKey;
}

export function filterByChild(
  items: ActivityHistoryItem[],
  childId: string | null,
): ActivityHistoryItem[] {
  if (childId == null) return items;
  return items.filter((item) => item.childId === childId);
}

export function eventCountsByChild(
  items: ActivityHistoryItem[],
  childIds: string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const childId of childIds) {
    counts[childId] = items.filter((item) => item.childId === childId).length;
  }
  return counts;
}

export function groupItemsByDay(
  items: ActivityHistoryItem[],
): { dayKey: HistoryDayKey; items: ActivityHistoryItem[] }[] {
  const groups = new Map<HistoryDayKey, ActivityHistoryItem[]>();
  for (const item of items) {
    const key = toDayKey(new Date(item.timestamp));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([dayKey, groupItems]) => ({
    dayKey,
    items: groupItems,
  }));
}

export function alertCategory(alertType: AlertType): ActivityCategory {
  switch (alertType) {
    case 'safe_zone_entry':
      return 'safe_zone';
    case 'geofence_breach':
      return 'safe_zone';
    case 'danger_zone_entry':
      return 'danger_zone';
    case 'check_in_safe':
      return 'check_in';
    default:
      return 'alert';
  }
}

export function alertStatus(alertType: AlertType): ActivityStatus {
  switch (alertType) {
    case 'safe_zone_entry':
    case 'check_in_safe':
      return 'safe';
    case 'geofence_breach':
    case 'low_battery':
    case 'device_offline':
    case 'device_tamper':
      return 'warning';
    case 'SOS':
    case 'danger_zone_entry':
    case 'child_missing':
      return 'danger';
    default:
      return 'warning';
  }
}

export function statusBadgeLabel(status: ActivityStatus): string {
  switch (status) {
    case 'safe':
      return 'Safe';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'High Risk';
  }
}

export function activityIconName(
  category: ActivityCategory,
  alertType?: AlertType,
): string {
  if (category === 'movement') return 'navigate-outline';
  if (category === 'check_in') return 'shield-checkmark-outline';
  if (alertType === 'safe_zone_entry') return 'home-outline';
  if (alertType === 'geofence_breach') return 'exit-outline';
  if (alertType === 'danger_zone_entry') return 'warning-outline';
  if (alertType === 'SOS') return 'alert-circle-outline';
  if (alertType === 'child_missing') return 'person-outline';
  if (alertType === 'low_battery') return 'battery-dead-outline';
  return 'information-circle-outline';
}

export function filterMatchesItem(
  filter: HistoryFilter,
  item: Pick<ActivityHistoryItem, 'kind' | 'category' | 'alertType'>,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'movement') return item.kind === 'location';
  if (filter === 'check_ins') {
    return item.alertType === 'check_in_safe' || item.category === 'check_in';
  }
  if (filter === 'zones') {
    return (
      item.alertType === 'safe_zone_entry' ||
      item.alertType === 'geofence_breach' ||
      item.alertType === 'danger_zone_entry'
    );
  }
  if (filter === 'alerts') {
    return (
      item.kind === 'alert' &&
      item.alertType !== 'check_in_safe' &&
      item.alertType !== 'safe_zone_entry' &&
      item.category !== 'check_in'
    );
  }
  return true;
}

export function computeActivityStats(items: ActivityHistoryItem[]): ActivityHistoryStats {
  const safeZonesVisited = items.filter((item) => item.alertType === 'safe_zone_entry').length;
  const checkInsCompleted = items.filter(
    (item) => item.alertType === 'check_in_safe' || item.category === 'check_in',
  ).length;
  const alertsTriggered = items.filter(
    (item) =>
      item.kind === 'alert' &&
      item.status !== 'safe' &&
      item.category !== 'check_in',
  ).length;

  const locationTimestamps = items
    .filter((item) => item.kind === 'location')
    .map((item) => new Date(item.timestamp).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  let timeActiveLabel = '—';
  if (locationTimestamps.length >= 2) {
    const spanMs = locationTimestamps[locationTimestamps.length - 1]! - locationTimestamps[0]!;
    const hours = Math.floor(spanMs / 3600000);
    const mins = Math.floor((spanMs % 3600000) / 60000);
    timeActiveLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } else if (locationTimestamps.length === 1) {
    timeActiveLabel = '< 1m';
  }

  const latestLocation = [...items]
    .filter((item) => item.kind === 'location')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const lastLocationLabel = latestLocation ? latestLocation.relativeTime : '—';

  return {
    safeZonesVisited,
    checkInsCompleted,
    alertsTriggered,
    timeActiveLabel,
    lastLocationLabel,
  };
}

export function mapApiStats(stats: ActivityStatsResponse): ActivityHistoryStats {
  let timeActiveLabel = '—';
  if (stats.time_active_seconds != null && stats.time_active_seconds > 0) {
    const hours = Math.floor(stats.time_active_seconds / 3600);
    const mins = Math.floor((stats.time_active_seconds % 3600) / 60);
    timeActiveLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } else if (stats.time_active_seconds === 0) {
    timeActiveLabel = '< 1m';
  }

  const lastLocationLabel = stats.last_location_at
    ? formatRelativeTime(stats.last_location_at)
    : '—';

  return {
    safeZonesVisited: stats.safe_zones_visited,
    checkInsCompleted: stats.check_ins_completed,
    alertsTriggered: stats.alerts_triggered,
    timeActiveLabel,
    lastLocationLabel,
  };
}

export function mapAlertToActivityItem(input: {
  id: string;
  alertType: AlertType;
  title: string;
  body: string;
  createdAt: string;
  childId: string;
  childName?: string;
  latitude?: number | null;
  longitude?: number | null;
}): ActivityHistoryItem {
  const category = alertCategory(input.alertType);
  const status = alertStatus(input.alertType);

  return {
    id: input.id,
    kind: 'alert',
    category,
    title: input.title,
    body: input.body,
    timestamp: input.createdAt,
    timeLabel: formatEventTimeLabel(input.createdAt),
    relativeTime: formatRelativeTime(input.createdAt),
    childId: input.childId,
    childName: input.childName,
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
    status,
    alertType: input.alertType,
  };
}

export function mapLocationToActivityItem(input: {
  id: string;
  childId: string;
  childName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}): ActivityHistoryItem {
  return {
    id: input.id,
    kind: 'location',
    category: 'movement',
    title: `Location update · ${input.childName}`,
    body: `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    timestamp: input.timestamp,
    timeLabel: formatEventTimeLabel(input.timestamp),
    relativeTime: formatRelativeTime(input.timestamp),
    childId: input.childId,
    childName: input.childName,
    latitude: input.latitude,
    longitude: input.longitude,
    status: 'safe',
  };
}

export function mapActivityApiItem(item: ActivityItemResponse): ActivityHistoryItem {
  const timestamp = item.timestamp;
  const childId = item.child_id;
  const childName = item.child_name ?? undefined;

  if (item.kind === 'location') {
    return mapLocationToActivityItem({
      id: item.id,
      childId,
      childName: childName ?? 'Child',
      latitude: item.latitude ?? 0,
      longitude: item.longitude ?? 0,
      timestamp,
    });
  }

  const alertType = (item.alert_type ?? 'check_in_safe') as AlertType;
  return mapAlertToActivityItem({
    id: item.id,
    alertType,
    title: item.title,
    body: item.body,
    createdAt: timestamp,
    childId,
    childName,
    latitude: item.latitude,
    longitude: item.longitude,
  });
}

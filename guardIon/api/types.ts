/** API types aligned with backend Pydantic schemas (snake_case). */

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  profile_photo?: string | null;
  created_at: string;
};

export type UserUpdate = {
  name?: string;
  phone_number?: string | null;
  profile_photo?: string | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type MessageResponse = {
  message: string;
};

export type OtpPurpose = 'signup' | 'password_reset';

export type ChildResponse = {
  id: string;
  user_id: string;
  name: string;
  age?: number | null;
  profile_photo?: string | null;
  created_at: string;
};

export type ChildCreate = {
  name: string;
  age?: number | null;
  profile_photo?: string | null;
};

export type ChildUpdate = {
  name?: string;
  age?: number | null;
  profile_photo?: string | null;
};

export type DeviceStatus = 'active' | 'inactive' | 'lost' | 'charging';

export type DeviceResponse = {
  id: string;
  device_id: string;
  child_id: string;
  status: DeviceStatus;
  battery_level?: number | null;
  signal_strength?: number | null;
  last_seen?: string | null;
  created_at: string;
};

export type DeviceRegister = {
  device_id: string;
  child_id: string;
};

export type DeviceUpdate = {
  status?: DeviceStatus | null;
  child_id?: string | null;
};

export type CurrentLocationResponse = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  timestamp: string;
  battery_level?: number | null;
};

export type LocationResponse = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  battery_level?: number | null;
  timestamp: string;
};

export type LocationHistoryResponse = {
  locations: LocationResponse[];
  total_count: number;
};

export type SafeZoneResponse = {
  id: string;
  child_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  zone_type: 'SAFE' | 'DANGER';
  created_at: string;
};

export type SafeZoneCreate = {
  child_id: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  zone_type?: 'SAFE' | 'DANGER';
};

export type SafeZoneUpdate = {
  zone_name?: string;
  center_lat?: number;
  center_lng?: number;
  radius?: number;
  zone_type?: 'SAFE' | 'DANGER';
};

export type AlertType =
  | 'SOS'
  | 'geofence_breach'
  | 'check_in_safe'
  | 'low_battery'
  | 'device_offline'
  | 'device_tamper'
  | 'child_missing'
  | 'danger_zone_entry'
  | 'safe_zone_entry';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type AlertResponse = {
  id: string;
  child_id: string;
  device_id: string;
  alert_type: AlertType;
  zone_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  status: AlertStatus;
  confidence: number;
  unprocessed: boolean;
  resolved_at?: string | null;
  created_at: string;
};

export type AlertListResponse = {
  alerts: AlertResponse[];
  total_count: number;
};

export type ActivityKind = 'alert' | 'location' | 'check_in';

export type ActivityItemResponse = {
  id: string;
  kind: ActivityKind;
  alert_type?: string | null;
  child_id: string;
  child_name?: string | null;
  title: string;
  body: string;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  zone_name?: string | null;
};

export type ActivityStatsResponse = {
  safe_zones_visited: number;
  check_ins_completed: number;
  alerts_triggered: number;
  time_active_seconds?: number | null;
  last_location_at?: string | null;
};

export type ActivityListResponse = {
  items: ActivityItemResponse[];
  total_count: number;
  stats: ActivityStatsResponse;
};

export type NotificationResponse = {
  id: string;
  user_id: string;
  alert_id?: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  sent_at: string;
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
  unread_count: number;
  total_count: number;
};

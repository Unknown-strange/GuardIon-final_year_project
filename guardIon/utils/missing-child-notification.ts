export type MissingChildNotificationPayload = {
  alert_id: string;
  child_id: string;
  child_name: string;
  image_url?: string | null;
  reporter_name: string;
  notes?: string | null;
  last_seen_description?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
};

export function parseMissingChildNotification(
  message: string,
): MissingChildNotificationPayload | null {
  try {
    const parsed = JSON.parse(message) as MissingChildNotificationPayload;
    if (!parsed?.alert_id || !parsed?.child_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function missingChildDisplayText(payload: MissingChildNotificationPayload): string {
  return `${payload.reporter_name} reported ${payload.child_name} as missing`;
}

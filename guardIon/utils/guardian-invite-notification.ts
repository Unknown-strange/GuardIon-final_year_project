export type GuardianInviteNotificationPayload = {
  guardian_id: string;
  child_id: string;
  child_name: string;
  inviter_name: string;
};

export function parseGuardianInviteNotification(
  message: string,
): GuardianInviteNotificationPayload | null {
  try {
    const parsed = JSON.parse(message) as GuardianInviteNotificationPayload;
    if (!parsed?.guardian_id || !parsed?.child_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function guardianInviteDisplayText(
  payload: GuardianInviteNotificationPayload,
): string {
  return `${payload.inviter_name} invited you to co-guard ${payload.child_name}`;
}

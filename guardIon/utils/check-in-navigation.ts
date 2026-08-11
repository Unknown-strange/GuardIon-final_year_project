import type { CheckInSession } from '@/hooks/use-check-in';

/** Reliable expo-router path with query params (params object alone can be dropped). */
export function buildCheckInPath(
  childId: string,
  session: CheckInSession,
  childName: string,
): string {
  const qs = new URLSearchParams({
    checkInId: session.checkInId,
    startedAt: String(session.startedAt),
    childName,
  });
  return `/check-in/${encodeURIComponent(childId)}?${qs.toString()}`;
}

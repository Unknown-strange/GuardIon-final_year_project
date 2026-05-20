import type { ChildSummary } from '@/components/guardian/child-summary-card';
import type { ChildGender, RegisterChildPayload } from '@/components/guardian/add-child-modal';
import {
  calculateAgeFromBirthDate,
  formatBirthDateIso,
} from '@/utils/child-age';

export function splitChildName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export function extractDeviceId(child: ChildSummary): string {
  if (child.deviceId) return child.deviceId;
  const prefix = 'Device · ';
  if (child.deviceLabel.startsWith(prefix)) {
    return child.deviceLabel.slice(prefix.length);
  }
  return child.deviceLabel;
}

export function birthDateFromChild(child: ChildSummary): Date {
  if (child.dateOfBirth) {
    const parsed = new Date(child.dateOfBirth);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  return new Date(today.getFullYear() - child.age, today.getMonth(), today.getDate());
}

export function childFormFromSummary(child: ChildSummary) {
  const { firstName, lastName } = splitChildName(child.name);
  return {
    firstName,
    lastName,
    birthDate: birthDateFromChild(child),
    gender: (child.gender ?? 'other') as ChildGender,
    deviceId: extractDeviceId(child),
  };
}

export function applyChildFormToSummary(
  child: ChildSummary,
  payload: RegisterChildPayload,
): ChildSummary {
  return {
    ...child,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    age: calculateAgeFromBirthDate(payload.dateOfBirth),
    deviceLabel: `Device · ${payload.deviceId.trim()}`,
    deviceId: payload.deviceId.trim(),
    gender: payload.gender,
    dateOfBirth: formatBirthDateIso(payload.dateOfBirth),
  };
}

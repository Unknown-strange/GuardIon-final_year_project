import { apiRequest } from '@/api/client';
import type { ChildResponse, DeviceResponse } from '@/api/types';
import { dedupeInflight } from '@/utils/request-dedupe';

export type GuardianHomeResponse = {
  children: ChildResponse[];
  devices: DeviceResponse[];
};

/** Single round-trip for home screen — children + devices together. */
export function fetchGuardianHome() {
  return dedupeInflight('guardian:home', () =>
    apiRequest<GuardianHomeResponse>('/guardian/home', {
      auth: true,
      timeoutMs: 60000,
    }),
  );
}

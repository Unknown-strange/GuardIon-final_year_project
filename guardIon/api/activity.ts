import { apiRequest } from '@/api/client';
import type { ActivityListResponse } from '@/api/types';

export function getActivityFeed(params?: {
  child_id?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
}) {
  return apiRequest<ActivityListResponse>('/activity', {
    auth: true,
    query: params,
  });
}

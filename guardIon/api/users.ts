import { apiRequest } from '@/api/client';
import type { UserResponse, UserUpdate } from '@/api/types';

export function fetchUserProfile() {
  return apiRequest<UserResponse>('/users/me', { auth: true });
}

export function updateUserProfile(payload: UserUpdate) {
  return apiRequest<UserResponse>('/users/me', {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}

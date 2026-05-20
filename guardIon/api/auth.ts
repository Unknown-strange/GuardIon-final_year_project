import { apiRequest } from '@/api/client';
import type {
  MessageResponse,
  OtpPurpose,
  TokenResponse,
  UserResponse,
} from '@/api/types';

export function login(email: string, password: string) {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
}

export function signupRequest(payload: {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
}) {
  return apiRequest<MessageResponse>('/auth/signup/request', {
    method: 'POST',
    body: {
      ...payload,
      email: payload.email.trim().toLowerCase(),
    },
  });
}

export function signupVerify(email: string, code: string) {
  return apiRequest<TokenResponse>('/auth/signup/verify', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), code },
  });
}

export function forgotPassword(email: string) {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      code,
      new_password: newPassword,
    },
  });
}

export function resendOtp(email: string, purpose: OtpPurpose) {
  return apiRequest<MessageResponse>('/auth/resend-otp', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), purpose },
  });
}

export function fetchCurrentUser() {
  return apiRequest<UserResponse>('/auth/me', { auth: true });
}

export function refreshSession(refreshToken: string) {
  return apiRequest<TokenResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export function googleSignIn(idToken: string) {
  return apiRequest<TokenResponse>('/auth/google', {
    method: 'POST',
    body: { id_token: idToken },
  });
}

export function googleSignInWithCode(payload: {
  code: string;
  redirect_uri: string;
  code_verifier?: string;
}) {
  return apiRequest<TokenResponse>('/auth/google/code', {
    method: 'POST',
    body: payload,
  });
}

export type { OtpPurpose, TokenResponse, UserResponse, MessageResponse };

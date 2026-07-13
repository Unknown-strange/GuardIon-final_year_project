import { API_BASE_URL } from '@/api/config';
import type { TokenResponse } from '@/api/types';
import { shouldRefreshAccessToken } from '@/lib/storage/jwt-utils';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/lib/storage/auth-storage';

let refreshInFlight: Promise<string | null> | null = null;

const REFRESH_TIMEOUT_MS = 20000;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as TokenResponse;
    await saveTokens(tokens.access_token, tokens.refresh_token);
    return tokens.access_token;
  } catch {
    // Network error / timeout / abort — fall back to no token so startup can proceed.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns a non-expired access token, refreshing with the refresh token when needed.
 * Concurrent callers share a single refresh request.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  if (!shouldRefreshAccessToken(token)) return token;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshed = await refreshAccessToken();
      if (refreshed) return refreshed;

      const current = await getAccessToken();
      if (current && !shouldRefreshAccessToken(current, 0)) return current;
      return null;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

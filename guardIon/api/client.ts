import { API_BASE_URL } from '@/api/config';
import { ApiError } from '@/api/errors';
import { getValidAccessToken } from '@/lib/storage/get-valid-access-token';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Abort the request after this many ms (default 20s) so a slow/down server can't hang the app. */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 30000;

/** fetch with an AbortController timeout; surfaces a clear ApiError instead of hanging forever. */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Check your connection and try again.', 408);
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, query, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getValidAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const requestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let response = await fetchWithTimeout(buildUrl(path, query), requestInit, timeoutMs);

  if (auth && response.status === 401) {
    const retryToken = await getValidAccessToken();
    if (retryToken) {
      headers.Authorization = `Bearer ${retryToken}`;
      response = await fetchWithTimeout(buildUrl(path, query), requestInit, timeoutMs);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail) && detail[0]?.msg) message = String(detail[0].msg);
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}

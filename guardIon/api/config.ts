import Constants from 'expo-constants';

const fallback = 'http://localhost:8000/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  fallback;

/** Derive WebSocket base URL from REST API URL (http→ws, https→wss). */
export function getWebSocketBaseUrl(): string {
  const apiUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://');
  }
  if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://');
  }
  return `ws://${apiUrl}`;
}

export const OTP_LENGTH = 5;

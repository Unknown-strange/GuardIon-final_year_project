import Constants from 'expo-constants';

const fallback = 'http://localhost:8000/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  fallback;

export const OTP_LENGTH = 5;

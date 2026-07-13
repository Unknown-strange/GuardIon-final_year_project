import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo } from 'react';

import { API_BASE_URL } from '@/api/config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export type GoogleSignInResult = {
  accessToken: string;
  refreshToken: string;
};

function getWebClientId() {
  const extra = Constants.expoConfig?.extra ?? {};
  return String(extra.googleWebClientId ?? '');
}

/** Parse params from both the query string and fragment of a returned deep link. */
function parseReturnedUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const collect = (search: string) => {
    new URLSearchParams(search).forEach((value, key) => {
      result[key] = value;
    });
  };

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  if (queryIndex >= 0) {
    const end = hashIndex > queryIndex ? hashIndex : url.length;
    collect(url.slice(queryIndex + 1, end));
  }
  if (hashIndex >= 0) {
    collect(url.slice(hashIndex + 1));
  }
  return result;
}

function googleErrorMessage(error: string): string {
  switch (error) {
    case 'access_denied':
      return 'Google sign-in was cancelled.';
    case 'google_not_configured':
      return 'Google Sign-In is not configured on the server.';
    case 'google_exchange_failed':
      return 'Could not verify your Google account. Please try again.';
    case 'google_account_unusable':
      return 'This Google account has no verified email and cannot be used.';
    case 'missing_code':
      return 'Google sign-in failed. Please try again.';
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

export function useGoogleSignIn() {
  const webClientId = useMemo(() => getWebClientId(), []);
  const isConfigured = Boolean(webClientId);

  const promptGoogleSignIn = useCallback(async (): Promise<GoogleSignInResult> => {
    if (!isConfigured) {
      throw new Error('Google Sign-In is not configured. Add client IDs to your .env file.');
    }

    // Deep link back into the app. In Expo Go this resolves to an exp:// URL automatically;
    // in dev/standalone builds it uses the `guardion` scheme.
    const returnUrl = AuthSession.makeRedirectUri({ scheme: 'guardion', path: 'oauthredirect' });

    // Google redirects here; the backend exchanges the code and deep-links tokens to returnUrl.
    const redirectUri = `${API_BASE_URL}/auth/google/callback`;

    const authUrl =
      `${GOOGLE_AUTH_ENDPOINT}?` +
      new URLSearchParams({
        client_id: webClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        include_granted_scopes: 'true',
        prompt: 'select_account',
        state: JSON.stringify({ returnUrl, redirectUri }),
      }).toString();

    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google sign-in was cancelled.');
    }
    if (result.type !== 'success' || !result.url) {
      throw new Error('Google sign-in failed.');
    }

    const params = parseReturnedUrl(result.url);
    if (params.error) {
      throw new Error(googleErrorMessage(params.error));
    }

    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    if (!accessToken || !refreshToken) {
      throw new Error('Google sign-in did not return a session. Please try again.');
    }

    return { accessToken, refreshToken };
  }, [isConfigured, webClientId]);

  return {
    isConfigured,
    isReady: true,
    promptGoogleSignIn,
  };
}

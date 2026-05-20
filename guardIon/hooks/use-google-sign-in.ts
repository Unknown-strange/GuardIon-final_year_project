import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo } from 'react';

WebBrowser.maybeCompleteAuthSession();

const EXPO_PROJECT_FULL_NAME = '@tekmart-boys/guardIon';

export type GoogleSignInResult =
  | { type: 'id_token'; idToken: string }
  | {
      type: 'code';
      code: string;
      redirectUri: string;
      codeVerifier?: string;
    };

function getGoogleAuthConfig() {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    webClientId: String(extra.googleWebClientId ?? ''),
    androidClientId: String(extra.googleAndroidClientId ?? ''),
    iosClientId: String(extra.googleIosClientId ?? ''),
    configuredRedirectUri: String(extra.googleRedirectUri ?? ''),
    expoProjectFullName: String(extra.expoProjectFullName ?? EXPO_PROJECT_FULL_NAME),
  };
}

function buildGoogleNativeRedirectUri(webClientId: string) {
  const prefix = webClientId.replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${prefix}:/oauthredirect`;
}

function resolveRedirectStrategy(
  webClientId: string,
  configuredRedirectUri: string,
  expoProjectFullName: string,
) {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    let proxyRedirectUri = configuredRedirectUri;
    if (!proxyRedirectUri.includes('auth.expo.io')) {
      try {
        proxyRedirectUri = AuthSession.getRedirectUrl();
      } catch {
        proxyRedirectUri = expoProjectFullName.startsWith('@')
          ? `https://auth.expo.io/${expoProjectFullName}`
          : `https://auth.expo.io/@${expoProjectFullName}`;
      }
    }

    return {
      isExpoGo: true,
      googleRedirectUri: proxyRedirectUri,
      appReturnUrl: AuthSession.makeRedirectUri({ path: 'oauthredirect' }),
    };
  }

  const googleRedirectUri =
    configuredRedirectUri && !configuredRedirectUri.includes('auth.expo.io')
      ? configuredRedirectUri
      : buildGoogleNativeRedirectUri(webClientId);

  return {
    isExpoGo: false,
    googleRedirectUri,
    appReturnUrl: googleRedirectUri,
  };
}

export function useGoogleSignIn() {
  const { webClientId, androidClientId, iosClientId, configuredRedirectUri, expoProjectFullName } =
    useMemo(() => getGoogleAuthConfig(), []);

  const redirectStrategy = useMemo(
    () => resolveRedirectStrategy(webClientId, configuredRedirectUri, expoProjectFullName),
    [configuredRedirectUri, expoProjectFullName, webClientId],
  );

  const isConfigured = redirectStrategy.isExpoGo
    ? Boolean(webClientId)
    : Boolean(webClientId) || Boolean(androidClientId) || Boolean(iosClientId);

  const oauthClientIds = useMemo(
    () => ({
      webClientId: webClientId || undefined,
      iosClientId: (redirectStrategy.isExpoGo ? webClientId : iosClientId) || undefined,
      androidClientId: (redirectStrategy.isExpoGo ? webClientId : androidClientId) || undefined,
    }),
    [androidClientId, iosClientId, redirectStrategy.isExpoGo, webClientId],
  );

  const [request, , promptAsync] = Google.useAuthRequest({
    ...oauthClientIds,
    redirectUri: redirectStrategy.googleRedirectUri,
  });

  const promptGoogleSignIn = useCallback(async (): Promise<GoogleSignInResult> => {
    if (!isConfigured) {
      throw new Error('Google Sign-In is not configured. Add client IDs to your .env file.');
    }
    if (!request) {
      throw new Error('Google Sign-In is still loading. Try again in a moment.');
    }

    if (redirectStrategy.isExpoGo) {
      if (!request.url) {
        throw new Error('Google Sign-In is still loading. Try again in a moment.');
      }

      const startUrl = `${redirectStrategy.googleRedirectUri}/start?${new URLSearchParams({
        authUrl: request.url,
        returnUrl: redirectStrategy.appReturnUrl,
      }).toString()}`;

      const browserResult = await WebBrowser.openAuthSessionAsync(
        startUrl,
        redirectStrategy.appReturnUrl,
      );

      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled.');
      }
      if (browserResult.type !== 'success') {
        throw new Error('Google sign-in failed.');
      }

      const result = request.parseReturnUrl(browserResult.url);

      if (result.type === 'error' || result.type !== 'success') {
        throw new Error('Google sign-in failed.');
      }

      if (!result.params?.code) {
        throw new Error('Google sign-in did not return an authorization code.');
      }

      return {
        type: 'code',
        code: result.params.code,
        redirectUri: redirectStrategy.googleRedirectUri,
        codeVerifier: request.codeVerifier ?? undefined,
      };
    }

    const result = await promptAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google sign-in was cancelled.');
    }
    if (result.type !== 'success') {
      throw new Error('Google sign-in failed.');
    }

    const idToken =
      result.authentication?.idToken ?? (result.params?.id_token as string | undefined);
    if (!idToken) {
      throw new Error(
        'No Google ID token received. Add the native redirect URI to your Web OAuth client in Google Cloud.',
      );
    }

    return { type: 'id_token', idToken };
  }, [isConfigured, promptAsync, redirectStrategy, request]);

  return {
    isConfigured,
    isReady: Boolean(request),
    promptGoogleSignIn,
  };
}

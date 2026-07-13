import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/api/auth';
import { getErrorMessage } from '@/api/errors';
import { clearTokens, getRefreshToken, saveTokens } from '@/lib/storage/auth-storage';
import { getValidAccessToken } from '@/lib/storage/get-valid-access-token';

type AuthUser = authApi.UserResponse;

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  completeSignup: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchCurrentUser();
    setUser(profile);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setUser(null);
        return;
      }
      await refreshProfile();
    } catch {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await authApi.refreshSession(refreshToken);
          await saveTokens(tokens.access_token, tokens.refresh_token);
          await refreshProfile();
          return;
        } catch {
          await clearTokens();
        }
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    await saveTokens(tokens.access_token, tokens.refresh_token);
    await refreshProfile();
  }, [refreshProfile]);

  const signInWithGoogleTokens = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await saveTokens(accessToken, refreshToken);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const completeSignup = useCallback(async (email: string, code: string) => {
    const tokens = await authApi.signupVerify(email, code);
    await saveTokens(tokens.access_token, tokens.refresh_token);
    await refreshProfile();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signInWithGoogleTokens,
      completeSignup,
      signOut,
      refreshProfile,
    }),
    [user, isLoading, signIn, signInWithGoogleTokens, completeSignup, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { getErrorMessage };

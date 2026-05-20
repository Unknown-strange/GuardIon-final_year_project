import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  clearGuardianProfilePhotoUri,
  loadGuardianProfilePhotoUri,
  saveGuardianProfilePhotoUri,
} from '@/utils/guardian-profile-photo';
import { pickChildPhoto } from '@/utils/pick-child-photo';

type GuardianProfilePhotoContextValue = {
  photoUri: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  pickAndSavePhoto: () => Promise<string | null>;
  removePhoto: () => Promise<void>;
};

const GuardianProfilePhotoContext = createContext<GuardianProfilePhotoContextValue | null>(null);

export function GuardianProfilePhotoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPhotoUri(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const uri = await loadGuardianProfilePhotoUri(user.id);
    setPhotoUri(uri);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  const pickAndSavePhoto = useCallback(async () => {
    if (!user) return null;
    const uri = await pickChildPhoto();
    if (!uri) return null;
    await saveGuardianProfilePhotoUri(user.id, uri);
    setPhotoUri(uri);
    return uri;
  }, [user]);

  const removePhoto = useCallback(async () => {
    if (!user) return;
    await clearGuardianProfilePhotoUri(user.id);
    setPhotoUri(null);
  }, [user]);

  const value = useMemo(
    () => ({
      photoUri,
      loading,
      refresh,
      pickAndSavePhoto,
      removePhoto,
    }),
    [photoUri, loading, refresh, pickAndSavePhoto, removePhoto],
  );

  return (
    <GuardianProfilePhotoContext.Provider value={value}>
      {children}
    </GuardianProfilePhotoContext.Provider>
  );
}

export function useGuardianProfilePhoto() {
  const ctx = useContext(GuardianProfilePhotoContext);
  if (!ctx) {
    throw new Error('useGuardianProfilePhoto must be used within GuardianProfilePhotoProvider');
  }
  return ctx;
}

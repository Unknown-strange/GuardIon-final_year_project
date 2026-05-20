import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(userId: string) {
  return `@guardian/profile-photo-uri/${userId}`;
}

export async function loadGuardianProfilePhotoUri(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

export async function saveGuardianProfilePhotoUri(userId: string, uri: string): Promise<string> {
  await AsyncStorage.setItem(storageKey(userId), uri);
  return uri;
}

export async function clearGuardianProfilePhotoUri(userId?: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.removeItem(storageKey(userId));
}

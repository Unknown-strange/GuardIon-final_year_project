import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@guardian/child-custom-avatars';

export async function loadChildCustomAvatars(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function getChildCustomAvatarUri(childId: string): Promise<string | null> {
  const map = await loadChildCustomAvatars();
  return map[childId] ?? null;
}

export async function setChildCustomAvatar(childId: string, uri: string): Promise<Record<string, string>> {
  const map = await loadChildCustomAvatars();
  const next = { ...map, [childId]: uri };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function removeChildCustomAvatar(childId: string): Promise<Record<string, string>> {
  const map = await loadChildCustomAvatars();
  const next = { ...map };
  delete next[childId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

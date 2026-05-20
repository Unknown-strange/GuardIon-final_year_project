import type { ImageSource } from 'expo-image';

/** child_1 → Kofi, child_2 → first Ama, child_3 → second Ama */
export const CHILD_AVATARS: Record<string, ImageSource> = {
  '1': require('@/assets/images_guardion/child_2.webp'),
  '2': require('@/assets/images_guardion/child_1.webp'),
  '3': require('@/assets/images_guardion/child_3.webp'),
};

export function getChildAvatarSource(childId: string): ImageSource {
  return CHILD_AVATARS[childId] ?? CHILD_AVATARS['1'];
}

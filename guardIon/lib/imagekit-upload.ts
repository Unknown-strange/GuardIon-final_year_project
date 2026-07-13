import { getImageKitUploadAuth } from '@/api/uploads';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

function isRemoteUrl(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function fileNameFromUri(uri: string, fallbackPrefix: string): string {
  const segment = uri.split('/').pop()?.split('?')[0];
  if (segment && segment.includes('.')) return segment;
  return `${fallbackPrefix}-${Date.now()}.jpg`;
}

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function uploadImageToImageKit(
  localUri: string,
  fileNamePrefix = 'child',
): Promise<string> {
  if (isRemoteUrl(localUri)) {
    return localUri;
  }

  const auth = await getImageKitUploadAuth();
  const formData = new FormData();

  formData.append('file', {
    uri: localUri,
    name: fileNameFromUri(localUri, fileNamePrefix),
    type: mimeFromUri(localUri),
  } as unknown as Blob);
  formData.append('fileName', fileNameFromUri(localUri, fileNamePrefix));
  formData.append('publicKey', auth.publicKey);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  if (auth.folder) {
    formData.append('folder', auth.folder);
  }

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImageKit upload failed (${response.status})`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error('ImageKit upload did not return a URL');
  }

  return payload.url;
}

export function isHttpsImageUrl(url?: string | null): boolean {
  return Boolean(url && /^https:\/\//i.test(url));
}

export async function ensureHttpsProfilePhoto(
  uri: string | null | undefined,
  fileNamePrefix = 'child',
): Promise<string | null> {
  if (!uri) return null;
  if (isRemoteUrl(uri)) return uri;
  return uploadImageToImageKit(uri, fileNamePrefix);
}

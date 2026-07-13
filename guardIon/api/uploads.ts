/** Upload API client helpers. */

import { apiRequest } from '@/api/client';

export type ImageKitAuthResponse = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  folder?: string;
  urlEndpoint?: string;
};

export function getImageKitUploadAuth() {
  return apiRequest<ImageKitAuthResponse>('/uploads/imagekit-auth', { auth: true });
}

type JwtPayload = {
  exp?: number;
  type?: string;
};

/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const part = token.split('.')[1];
  if (!part) return null;

  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** True when token is expired or will expire within the refresh buffer. */
export function shouldRefreshAccessToken(token: string, bufferSeconds = 120): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + bufferSeconds;
}

/**
 * Dev-only API logging — visible in Metro / Expo console.
 */
export function logApi(scope: string, message: string, extra?: unknown) {
  if (!__DEV__) return;
  const prefix = `[GuardIon API · ${scope}]`;
  if (extra !== undefined) {
    console.log(prefix, message, extra);
  } else {
    console.log(prefix, message);
  }
}

export function logApiError(scope: string, message: string, error?: unknown) {
  const prefix = `[GuardIon API · ${scope}]`;
  console.warn(prefix, message, error);
}

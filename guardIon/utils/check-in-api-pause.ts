/**
 * Pause non-critical background API polls during check-in create + waiting screen.
 */let pauseCount = 0;

export function isCheckInApiPaused(): boolean {
  return pauseCount > 0;
}

export function beginCheckInApiPause(): void {
  pauseCount += 1;
}

export function endCheckInApiPause(): void {
  pauseCount = Math.max(0, pauseCount - 1);
}

import { usePathname } from 'expo-router';
import { useMemo } from 'react';

export type GuardianTab = 'home' | 'alerts' | 'map' | 'history' | 'settings';

export function useGuardianTabFocus(): GuardianTab | null {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname.includes('(tabs)')) return null;
    if (pathname.includes('/alerts')) return 'alerts';
    if (pathname.includes('/map')) return 'map';
    if (pathname.includes('/history')) return 'history';
    if (pathname.includes('/settings')) return 'settings';
    return 'home';
  }, [pathname]);
}

export function useIsGuardianTabFocused(...tabs: GuardianTab[]) {
  const current = useGuardianTabFocus();
  return current != null && tabs.includes(current);
}

import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** True when the app is in the foreground (active). */
export function useAppForeground() {
  const [isForeground, setIsForeground] = useState(
    () => AppState.currentState === 'active',
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      setIsForeground(next === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  return isForeground;
}

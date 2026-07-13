import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors } from '@/constants/theme';
import { useActiveAlertCount } from '@/hooks/use-active-alert-count';

type Props = {
  color: string;
  focused: boolean;
};

export function AlertsTabIcon({ color, focused }: Props) {
  const count = useActiveAlertCount();
  const hasActive = count > 0;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!hasActive) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [hasActive, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const iconColor = hasActive ? GuardianColors.danger : color;
  const badgeLabel = count > 99 ? '99+' : String(count);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.iconWrap,
          focused && styles.iconWrapFocused,
          hasActive && styles.iconWrapAlert,
          pulseStyle,
        ]}>
        <Ionicons
          name={focused ? 'notifications' : 'notifications-outline'}
          size={22}
          color={iconColor}
        />
      </Animated.View>
      {hasActive ? (
        <View style={styles.badge}>
          <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.badgeText}>
            {badgeLabel}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  iconWrapFocused: {
    backgroundColor: GuardianColors.navyMuted,
  },
  iconWrapAlert: {
    backgroundColor: GuardianColors.dangerMuted,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GuardianColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: GuardianColors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
});

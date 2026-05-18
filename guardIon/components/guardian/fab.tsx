import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GuardianColors } from '@/constants/theme';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function GuardianFab({ onPress, accessibilityLabel = 'Add', style }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[pulseStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={styles.fab}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

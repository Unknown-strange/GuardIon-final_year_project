import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function useShimmerOpacity() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export function ShimmerBlock({ style }: Props) {
  const opacity = useShimmerOpacity();

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
});

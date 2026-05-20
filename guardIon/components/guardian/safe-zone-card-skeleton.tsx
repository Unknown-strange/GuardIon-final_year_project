import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { GuardianColors, Layout } from '@/constants/theme';

function ShimmerBlock({
  style,
  opacity,
}: {
  style: object;
  opacity: Animated.Value;
}) {
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

export function SafeZoneCardSkeleton() {
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

  return (
    <View style={styles.card}>
      <ShimmerBlock style={styles.map} opacity={opacity} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ShimmerBlock style={styles.title} opacity={opacity} />
          <View style={styles.actions}>
            <ShimmerBlock style={styles.icon} opacity={opacity} />
            <ShimmerBlock style={styles.icon} opacity={opacity} />
          </View>
        </View>
        <ShimmerBlock style={styles.address} opacity={opacity} />
        <View style={styles.divider} />
        <View style={styles.footer}>
          <ShimmerBlock style={styles.pill} opacity={opacity} />
          <ShimmerBlock style={styles.pillWide} opacity={opacity} />
        </View>
      </View>
    </View>
  );
}

export function SafeZoneListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SafeZoneCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
    paddingHorizontal: Layout.screenPadding,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  block: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  map: {
    width: '100%',
    height: 140,
    borderRadius: 0,
  },
  body: {
    padding: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    width: '38%',
    height: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  address: {
    width: '72%',
    height: 14,
  },
  divider: {
    height: 1,
    backgroundColor: GuardianColors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    width: 96,
    height: 28,
    borderRadius: 14,
  },
  pillWide: {
    width: 130,
    height: 28,
    borderRadius: 14,
  },
});

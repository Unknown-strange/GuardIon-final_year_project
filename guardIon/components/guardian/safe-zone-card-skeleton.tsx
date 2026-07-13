import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/guardian/skeleton/shimmer-block';
import { GuardianColors, Layout } from '@/constants/theme';

export function SafeZoneCardSkeleton() {
  return (
    <View style={styles.card}>
      <ShimmerBlock style={styles.map} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ShimmerBlock style={styles.title} />
          <View style={styles.actions}>
            <ShimmerBlock style={styles.icon} />
            <ShimmerBlock style={styles.icon} />
          </View>
        </View>
        <ShimmerBlock style={styles.address} />
        <View style={styles.divider} />
        <View style={styles.footer}>
          <ShimmerBlock style={styles.pill} />
          <ShimmerBlock style={styles.pillWide} />
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

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/guardian/skeleton/shimmer-block';
import { GuardianColors } from '@/constants/theme';

function Circle({ size }: { size: number }) {
  return <ShimmerBlock style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

function Line({ width, height = 14 }: { width: `${number}%` | number; height?: number }) {
  return <ShimmerBlock style={{ width, height, borderRadius: height / 2 }} />;
}

function ChipSkeleton() {
  return (
    <View style={styles.chip}>
      <Circle size={36} />
      <View style={styles.chipMeta}>
        <Line width="70%" height={14} />
        <Line width="50%" height={11} />
      </View>
    </View>
  );
}

export function AlertsChildSelectorSkeleton() {
  return (
    <View style={styles.selectorWrap}>
      <ShimmerBlock style={styles.selectorTitle} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorRow}>
        <ChipSkeleton />
        <ChipSkeleton />
        <ChipSkeleton />
      </ScrollView>
    </View>
  );
}

export function ActiveAlertsSummarySkeleton() {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.heroCard}>
        <Line width="55%" height={10} />
        <Circle size={64} />
        <Line width="80%" height={12} />
      </View>
      <View style={styles.statusCard}>
        <Line width="45%" height={10} />
        <Line width="75%" height={16} />
        <Line width="50%" height={20} />
        <Line width="65%" height={11} />
      </View>
    </View>
  );
}

export function AlertCardSkeleton() {
  return (
    <View style={styles.alertCard}>
      <ShimmerBlock style={styles.alertRail} />
      <View style={styles.alertBody}>
        <View style={styles.alertTop}>
          <Circle size={40} />
          <Line width={48} height={11} />
        </View>
        <Line width="65%" height={16} />
        <Line width="90%" height={14} />
        <Line width="40%" height={12} />
        <ShimmerBlock style={styles.actionBar} />
      </View>
    </View>
  );
}

export function AlertCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.alertList}>
      {Array.from({ length: count }).map((_, index) => (
        <AlertCardSkeleton key={`alert-skeleton-${index}`} />
      ))}
    </View>
  );
}

export function AlertsContactRowSkeleton() {
  return (
    <View style={styles.contactRow}>
      <Circle size={44} />
      <View style={styles.contactMeta}>
        <Line width="55%" height={16} />
        <Line width="70%" height={12} />
      </View>
      <Circle size={44} />
    </View>
  );
}

export function AlertsContactRowSkeletonList({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.contactList}>
      {Array.from({ length: count }).map((_, index) => (
        <AlertsContactRowSkeleton key={`contact-skeleton-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  selectorWrap: {
    gap: 10,
    marginBottom: 16,
  },
  selectorTitle: {
    width: 90,
    height: 12,
    borderRadius: 6,
  },
  selectorRow: {
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: GuardianColors.overlaySheet,
    borderWidth: 1.5,
    borderColor: GuardianColors.border,
    minWidth: 170,
  },
  chipMeta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1.2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.surface,
    padding: 14,
    paddingLeft: 18,
    alignItems: 'center',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    gap: 6,
    justifyContent: 'center',
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  alertRail: {
    width: 5,
    borderRadius: 0,
  },
  alertBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBar: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    marginTop: 4,
  },
  contactList: {
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  contactMeta: {
    flex: 1,
    gap: 6,
  },
});

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/guardian/skeleton/shimmer-block';
import { GuardianColors, Layout } from '@/constants/theme';

function Pill() {
  return <ShimmerBlock style={styles.statPill} />;
}

function TimelineCard() {
  return (
    <View style={styles.timelineRow}>
      <ShimmerBlock style={styles.timeBlock} />
      <View style={styles.card}>
        <ShimmerBlock style={styles.cardRail} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <ShimmerBlock style={styles.icon} />
            <View style={styles.meta}>
              <ShimmerBlock style={styles.lineWide} />
              <ShimmerBlock style={styles.lineNarrow} />
            </View>
          </View>
          <ShimmerBlock style={styles.lineMedium} />
        </View>
      </View>
    </View>
  );
}

export function HistoryScreenSkeleton() {
  return (
    <View style={styles.wrap}>
      <ShimmerBlock style={styles.title} />
      <ShimmerBlock style={styles.subtitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        <Pill />
        <Pill />
        <Pill />
        <Pill />
        <Pill />
      </ScrollView>
      <View style={styles.filters}>
        <ShimmerBlock style={styles.filterChip} />
        <ShimmerBlock style={styles.filterChip} />
        <ShimmerBlock style={styles.filterChip} />
      </View>
      <TimelineCard />
      <TimelineCard />
      <TimelineCard />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  title: {
    width: '55%',
    height: 28,
    borderRadius: 8,
  },
  subtitle: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  pills: {
    gap: 10,
    paddingVertical: 4,
  },
  statPill: {
    width: 112,
    height: 96,
    borderRadius: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    width: 92,
    height: 34,
    borderRadius: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  timeBlock: {
    width: 48,
    height: 14,
    borderRadius: 7,
    marginTop: 14,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.surface,
  },
  cardRail: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  meta: {
    flex: 1,
    gap: 8,
  },
  lineWide: {
    width: '75%',
    height: 14,
    borderRadius: 7,
  },
  lineNarrow: {
    width: '55%',
    height: 12,
    borderRadius: 6,
  },
  lineMedium: {
    width: '40%',
    height: 12,
    borderRadius: 6,
  },
});

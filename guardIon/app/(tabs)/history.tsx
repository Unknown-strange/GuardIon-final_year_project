import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityTimelineCard } from '@/components/guardian/activity-timeline-card';
import { HistoryChildSelector } from '@/components/guardian/history-child-selector';
import { HistoryDateFilter } from '@/components/guardian/history-date-filter';
import { HistoryFilterTabs } from '@/components/guardian/history-filter-tabs';
import { HistoryStatPill } from '@/components/guardian/history-stat-pill';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { HistoryScreenSkeleton } from '@/components/guardian/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useActivityHistory } from '@/hooks/use-activity-history';
import type { ActivityHistoryItem } from '@/hooks/use-activity-history';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import {
  activityPageTitle,
  eventCountsByChild,
  filterByChild,
  filterMatchesItem,
  formatDayLabel,
  groupItemsByDay,
  todayDayKey,
  type HistoryDayKey,
  type HistoryFilter,
} from '@/utils/activity-history';

function openActivityItem(
  router: ReturnType<typeof useRouter>,
  item: ActivityHistoryItem,
) {
  if (item.latitude != null && item.longitude != null && item.childId) {
    router.push({
      pathname: '/(tabs)/map',
      params: {
        childId: item.childId,
        focusLat: String(item.latitude),
        focusLng: String(item.longitude),
      },
    } as any);
    return;
  }

  if (item.childId) {
    router.push(`/child/${item.childId}` as any);
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { children } = useGuardianData();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [selectedDayKey, setSelectedDayKey] = useState<HistoryDayKey>(todayDayKey());
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { items, stats, loading, refreshing, refresh } = useActivityHistory({
    selectedChildId,
    selectedDayKey,
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const scopedItems = useMemo(
    () => filterByChild(items, selectedChildId),
    [items, selectedChildId],
  );

  const filteredItems = useMemo(
    () => scopedItems.filter((item) => filterMatchesItem(filter, item)),
    [filter, scopedItems],
  );

  const timelineGroups = useMemo(
    () => groupItemsByDay(filteredItems),
    [filteredItems],
  );

  const childEventCounts = useMemo(
    () => eventCountsByChild(items, children.map((child) => child.id)),
    [children, items],
  );

  const selectionLabel = useMemo(() => {
    if (selectedChildId == null) {
      return children.length === 0 ? 'No children linked' : 'All children';
    }
    return children.find((child) => child.id === selectedChildId)?.name ?? 'Selected child';
  }, [children, selectedChildId]);

  const onRefresh = useCallback(() => {
    void refresh({ pull: true });
  }, [refresh]);

  let cardIndex = 0;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GuardianColors.primary}
            colors={[GuardianColors.primary]}
          />
        }>
        <ScreenHeader />

        <View style={styles.headerBlock}>
          <ThemedText style={styles.pageTitle}>{activityPageTitle(selectedDayKey)}</ThemedText>
          <View style={styles.headerMeta}>
            <ThemedText style={styles.metaText}>{selectionLabel}</ThemedText>
          </View>
          <HistoryDateFilter value={selectedDayKey} onChange={setSelectedDayKey} />
          <ThemedText style={styles.intro}>
            Alerts, zone events, and location updates from your children&apos;s devices.
          </ThemedText>
        </View>

        {children.length > 0 ? (
          <HistoryChildSelector
            items={children}
            selectedChildId={selectedChildId}
            eventCounts={childEventCounts}
            totalEvents={scopedItems.length}
            onSelect={setSelectedChildId}
          />
        ) : null}

        {loading && items.length === 0 ? (
          <HistoryScreenSkeleton />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(280)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsRow}>
                <HistoryStatPill
                  icon="home-outline"
                  value={stats.safeZonesVisited}
                  label="Safe zones visited"
                  tone="safe"
                />
                <HistoryStatPill
                  icon="shield-checkmark-outline"
                  value={stats.checkInsCompleted}
                  label="Check-ins completed"
                  tone="primary"
                />
                <HistoryStatPill
                  icon="notifications-outline"
                  value={stats.alertsTriggered}
                  label="Alerts triggered"
                  tone="warning"
                />
                <HistoryStatPill
                  icon="time-outline"
                  value={stats.timeActiveLabel}
                  label="Time active"
                  tone="neutral"
                />
                <HistoryStatPill
                  icon="location-outline"
                  value={stats.lastLocationLabel}
                  label="Last known location"
                  tone="primary"
                />
              </ScrollView>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(280)} style={styles.filtersWrap}>
              <HistoryFilterTabs value={filter} onChange={setFilter} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(280)} style={styles.sectionHead}>
              <ThemedText style={styles.sectionTitle}>Activity Timeline</ThemedText>
              <ThemedText style={styles.sectionCount}>{filteredItems.length} events</ThemedText>
            </Animated.View>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Image
                  source={require('@/assets/placeholder_images/history-placeholder.png')}
                  style={styles.emptyImage}
                  contentFit="contain"
                />
                <ThemedText style={styles.emptyTitle}>No Activity History Yet</ThemedText>
                <ThemedText style={styles.emptyBody}>
                  {items.length === 0
                    ? 'Movement history will appear once tracking begins. Stay informed about every step your child takes.'
                    : 'No events match your filters. Try another day, child, or category.'}
                </ThemedText>
              </View>
            ) : (
              timelineGroups.map((group) => (
                <View key={group.dayKey}>
                  {timelineGroups.length > 1 ? (
                    <ThemedText style={styles.dayHeader}>
                      {formatDayLabel(group.dayKey)}
                    </ThemedText>
                  ) : null}
                  {group.items.map((item, index) => {
                    const globalIndex = cardIndex++;
                    const isLast =
                      group === timelineGroups[timelineGroups.length - 1] &&
                      index === group.items.length - 1;
                    return (
                      <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(140 + globalIndex * 40).duration(280)}>
                        <ActivityTimelineCard
                          item={item}
                          isLast={isLast}
                          onPress={() => openActivityItem(router, item)}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  headerBlock: {
    marginBottom: 16,
    gap: 8,
  },
  pageTitle: {
    ...Typography.title,
    color: GuardianColors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    ...Typography.bodySemi,
    color: GuardianColors.primary,
    flex: 1,
  },
  intro: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  statsRow: {
    gap: 10,
    paddingBottom: 16,
  },
  filtersWrap: {
    marginBottom: 16,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.section,
    color: GuardianColors.text,
  },
  sectionCount: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  dayHeader: {
    ...Typography.label,
    color: GuardianColors.textMuted,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GuardianColors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
});

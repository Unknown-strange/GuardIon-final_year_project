import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListCardSkeletonList } from '@/components/guardian/skeleton';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useActivityHistory } from '@/hooks/use-activity-history';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading } = useActivityHistory();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader />
        <SectionTitle title="History" />
        <ThemedText style={styles.intro}>
          Alerts and location updates from your children&apos;s devices.
        </ThemedText>

        {loading && items.length === 0 ? (
          <ListCardSkeletonList variant="guardian" count={5} />
        ) : items.length === 0 ? (
          <ThemedText style={styles.empty}>No activity yet.</ThemedText>
        ) : (
          items.map((row) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name="time-outline" size={20} color={GuardianColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.title}>{row.title}</ThemedText>
                <ThemedText style={styles.sub}>{row.sub}</ThemedText>
              </View>
              <ThemedText style={styles.time}>{row.time}</ThemedText>
            </View>
          ))
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
  intro: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginBottom: 16,
  },
  empty: {
    ...Typography.body,
    color: GuardianColors.textMuted,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  sub: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    marginTop: 2,
  },
  time: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '600',
  },
});

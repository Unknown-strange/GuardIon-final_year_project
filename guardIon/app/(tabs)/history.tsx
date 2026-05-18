import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

const PLACEHOLDER = [
  { id: '1', title: 'Location update', sub: 'Mia · School zone', time: 'Today · 9:12 AM' },
  { id: '2', title: 'Heart rate logged', sub: '72 bpm · normal', time: 'Today · 8:40 AM' },
  { id: '3', title: 'Geofence entry', sub: 'Home safe zone', time: 'Yesterday · 6:02 PM' },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

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
          A chronological log of movements, vitals, and zone events will appear here.
        </ThemedText>

        {PLACEHOLDER.map((row) => (
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
        ))}
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

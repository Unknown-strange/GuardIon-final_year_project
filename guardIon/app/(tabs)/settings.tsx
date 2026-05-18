import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

const ROWS = [
  {
    icon: 'people-outline' as const,
    label: 'Family & devices',
    hint: 'Manage children and trackers',
    href: '/settings/family-devices' as const,
  },
  {
    icon: 'notifications-outline' as const,
    label: 'Notifications',
    hint: 'Alerts & quiet hours',
    href: '/settings/notifications' as const,
  },
  {
    icon: 'shield-outline' as const,
    label: 'Privacy & data',
    hint: 'Sharing and retention',
    href: '/settings/privacy-data' as const,
  },
  {
    icon: 'help-circle-outline' as const,
    label: 'Help & support',
    hint: 'Guides and contact',
    href: '/settings/help-support' as const,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
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
        <SectionTitle title="Settings" />
        <ThemedText style={styles.intro}>
          Account, safety preferences, and integrations will live in this hub.
        </ThemedText>

        {ROWS.map((row) => (
          <Pressable key={row.label} style={styles.row} onPress={() => router.push(row.href)}>
            <View style={styles.icon}>
              <Ionicons name={row.icon} size={22} color={GuardianColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>{row.label}</ThemedText>
              <ThemedText style={styles.hint}>{row.hint}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GuardianColors.textMuted} />
          </Pressable>
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 16,
  },
  hint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
});

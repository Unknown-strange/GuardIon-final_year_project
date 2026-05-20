import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SecuritySettingsCard } from '@/components/guardian/security-settings-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

const SECURITY_ITEMS = [
  {
    icon: 'lock-closed-outline' as const,
    title: 'Change Password',
    subtitle: 'Update your login password',
    href: '/settings/change-password' as const,
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Manage Logged-In Devices',
    subtitle: 'View and manage active sessions',
    href: '/settings/logged-in-devices' as const,
  },
];

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openAlerts = () => {
    router.push('/(tabs)/alerts' as any);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Security Settings</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={openAlerts}
            style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={GuardianColors.text} />
          </Pressable>
        </View>

        <View style={styles.headerRule} />

        <ThemedText style={styles.lead}>
          Keep your GuardIon account secure by updating your password and reviewing active sessions.
        </ThemedText>

        <View style={styles.list}>
          {SECURITY_ITEMS.map((item, index) => (
            <Animated.View key={item.title} entering={FadeInDown.delay(index * 70).duration(280)}>
              <SecuritySettingsCard
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() => router.push(item.href as any)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 20,
    color: GuardianColors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRule: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginBottom: 18,
    opacity: 0.8,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: GuardianColors.textSecondary,
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
});

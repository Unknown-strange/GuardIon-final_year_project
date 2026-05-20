import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SettingsSubScreen({ title, subtitle, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
            style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {title}
          </ThemedText>
          <View style={styles.headerSide} />
        </View>

        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}

        {children}
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
    marginBottom: 12,
    minHeight: 44,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    ...Typography.title,
    color: GuardianColors.text,
    textAlign: 'center',
    fontSize: 20,
  },
  subtitle: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
});

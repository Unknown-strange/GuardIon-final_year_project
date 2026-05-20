import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function SecuritySettingsCard({ icon, title, subtitle, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={GuardianColors.primary} />
      </View>

      <View style={styles.meta}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>

      <Ionicons name="chevron-forward" size={20} color={GuardianColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: GuardianColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: GuardianColors.borderStrong,
    backgroundColor: GuardianColors.overlaySheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  subtitle: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

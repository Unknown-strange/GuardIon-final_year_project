import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type IconVariant = 'primary' | 'danger' | 'neutral';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconVariant?: IconVariant;
  label: string;
  hint: string;
  onPress: () => void;
  isLast?: boolean;
};

function iconColors(variant: IconVariant) {
  switch (variant) {
    case 'danger':
      return { bg: GuardianColors.dangerMuted, fg: GuardianColors.danger };
    case 'neutral':
      return { bg: GuardianColors.overlaySheet, fg: GuardianColors.textSecondary };
    default:
      return { bg: GuardianColors.navyMuted, fg: GuardianColors.primary };
  }
}

export function SettingsMenuRow({
  icon,
  iconVariant = 'primary',
  label,
  hint,
  onPress,
  isLast,
}: Props) {
  const colors = iconColors(iconVariant);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={20} color={colors.fg} />
      </View>
      <View style={styles.meta}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.hint} numberOfLines={2}>
          {hint}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GuardianColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: GuardianColors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  hint: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    lineHeight: 17,
  },
});

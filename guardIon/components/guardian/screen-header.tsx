import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  guardianLabel?: string;
  userName?: string;
  subtitle?: string;
  onBellPress?: () => void;
};

export function ScreenHeader({
  guardianLabel = 'Guardian',
  userName = 'Robert Anderson',
  subtitle,
  onBellPress,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar} accessibilityLabel="Profile">
          <Ionicons name="person" size={22} color={GuardianColors.primary} />
        </View>
        <View style={styles.nameBlock}>
          <ThemedText style={styles.role}>{guardianLabel}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {userName}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={10}
        onPress={onBellPress}
        style={styles.bell}>
        <Ionicons name="notifications-outline" size={22} color={GuardianColors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  nameBlock: {
    flex: 1,
  },
  role: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
  },
  name: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
});

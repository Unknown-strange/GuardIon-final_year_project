import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianProfilePhoto } from '@/hooks/use-guardian-profile-photo';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  guardianLabel?: string;
  userName?: string;
  subtitle?: string;
  onBellPress?: () => void;
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ScreenHeader({
  guardianLabel = 'Guardian',
  userName,
  subtitle,
  onBellPress,
}: Props) {
  const { user } = useAuth();
  const { photoUri } = useGuardianProfilePhoto();
  const displayName = userName ?? user?.name ?? 'Guardian';

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar} accessibilityLabel="Profile">
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <ThemedText style={styles.avatarInitials}>{initialsFromName(displayName)}</ThemedText>
          )}
        </View>
        <View style={styles.nameBlock}>
          <ThemedText style={styles.role}>{guardianLabel}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {displayName}
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
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
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

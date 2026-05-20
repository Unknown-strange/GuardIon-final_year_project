import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { GuardianProfile } from '@/constants/guardian-profile-mocks';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  profile: GuardianProfile;
  photoUri?: string | null;
  onEditPhoto?: () => void;
};

export function GuardianProfileCard({ profile, photoUri, onEditPhoto }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatarBlock}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <ThemedText style={styles.initials}>{profile.initials}</ThemedText>
            )}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={onEditPhoto}
          style={styles.cameraBtn}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <ThemedText style={styles.name}>{profile.name}</ThemedText>
      <ThemedText style={styles.email}>{profile.email}</ThemedText>
      <View style={styles.rolePill}>
        <ThemedText style={styles.roleText}>{profile.role}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  avatarBlock: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.surface,
    shadowColor: GuardianColors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraBtn: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: GuardianColors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: GuardianColors.primary,
    marginBottom: 4,
  },
  email: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginBottom: 10,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: GuardianColors.overlaySheet,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  roleText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  label?: string;
  childId?: string;
  imageUri?: string | null;
  onPick: () => void;
  size?: number;
};

export function ChildPhotoPicker({
  label = 'Add Photo',
  childId,
  imageUri,
  onPick,
  size = 88,
}: Props) {
  const radius = size / 2;

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPick}>
        <View style={styles.photoBlock}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: radius }} contentFit="cover" />
          ) : childId ? (
            <ChildAvatar childId={childId} size={size} borderRadius={radius} />
          ) : (
            <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
              <Ionicons name="person" size={32} color={GuardianColors.textMuted} />
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>
      <ThemedText style={styles.hint}>Tap to upload a profile photo</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.primary,
  },
  photoBlock: {
    position: 'relative',
  },
  placeholder: {
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: GuardianColors.surface,
  },
  hint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
});

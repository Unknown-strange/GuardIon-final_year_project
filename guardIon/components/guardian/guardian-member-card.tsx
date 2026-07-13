import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { GuardianMember } from '@/constants/guardian-profile-mocks';
import { getGuardianInitials } from '@/constants/guardian-profile-mocks';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  guardian: GuardianMember;
  onMenuPress?: () => void;
};

export function GuardianMemberCard({ guardian, onMenuPress }: Props) {
  const initials = getGuardianInitials(guardian.name);
  const avatarColor = guardian.avatarColor ?? GuardianColors.primary;
  const isPending = guardian.status === 'pending';

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }

    if (isPending) {
      Alert.alert(guardian.name, 'Invite pending', [
        { text: 'Resend invite', onPress: () => {} },
        { text: 'Cancel invite', style: 'destructive', onPress: () => {} },
        { text: 'Close', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert(guardian.name, 'Choose an action', [
      { text: 'Edit permissions', onPress: () => {} },
      ...(guardian.isPrimary
        ? []
        : [{ text: 'Remove guardian', style: 'destructive' as const, onPress: () => {} }]),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        guardian.isPrimary && !isPending && styles.cardPrimary,
        isPending && styles.cardPending,
      ]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }, isPending && styles.avatarPending]}>
        <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.initials}>
          {initials}
        </ThemedText>
      </View>

      <View style={styles.meta}>
        <View style={styles.badgeRow}>
          {isPending ? (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={12} color={GuardianColors.warning} />
              <ThemedText style={styles.pendingText}>Invite pending</ThemedText>
            </View>
          ) : (
            <View style={[styles.roleBadge, guardian.isPrimary && styles.roleBadgePrimary]}>
              <ThemedText
                style={[styles.roleText, guardian.isPrimary && styles.roleTextPrimary]}>
                {guardian.role}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.name}>{guardian.name}</ThemedText>
        <ThemedText style={styles.email} numberOfLines={1}>
          {guardian.email}
        </ThemedText>
        {isPending ? (
          <ThemedText style={styles.pendingHint}>Waiting for them to accept in the app</ThemedText>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Options for ${guardian.name}`}
        hitSlop={8}
        onPress={handleMenu}
        style={styles.menuBtn}>
        <Ionicons name="ellipsis-vertical" size={18} color={GuardianColors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  cardPrimary: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FAFCFF',
  },
  cardPending: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPending: {
    opacity: 0.85,
  },
  initials: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  meta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: GuardianColors.overlaySheet,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  roleBadgePrimary: {
    backgroundColor: GuardianColors.navyMuted,
    borderColor: '#BFDBFE',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: GuardianColors.warningMuted,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    ...Typography.caption,
    color: '#92400E',
    fontWeight: '800',
  },
  roleText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '800',
  },
  roleTextPrimary: {
    color: GuardianColors.primary,
  },
  name: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
    marginTop: 2,
  },
  email: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '500',
  },
  pendingHint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.overlaySheet,
  },
});

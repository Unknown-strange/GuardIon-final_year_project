import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  child: ChildSummary;
  age: number;
  imageUri?: string | null;
  isDeleting?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ChildManagedCard({
  child,
  age,
  imageUri,
  isDeleting = false,
  onPress,
  onEdit,
  onDelete,
}: Props) {
  const { connectionStatus } = child;

  const handleDelete = () => {
    if (isDeleting) return;
    if (onDelete) {
      onDelete();
      return;
    }
    Alert.alert(
      'Remove child profile?',
      `Remove ${child.name} from your managed devices? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const statusLabel =
    connectionStatus === 'connecting'
      ? 'CONNECTING'
      : connectionStatus === 'online'
        ? 'ONLINE'
        : 'OFFLINE';

  const statusPillStyle =
    connectionStatus === 'connecting'
      ? styles.statusConnecting
      : connectionStatus === 'online'
        ? styles.statusOnline
        : styles.statusOffline;

  const statusTextStyle =
    connectionStatus === 'connecting'
      ? styles.statusTextConnecting
      : connectionStatus === 'online'
        ? styles.statusTextOnline
        : styles.statusTextOffline;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDeleting ? undefined : onPress}
      style={[styles.card, isDeleting && styles.cardDeleting]}>
      <ChildAvatar childId={child.id} size={64} borderRadius={14} imageUri={imageUri} />

      <View style={styles.meta}>
        <ThemedText style={styles.name}>{child.name}</ThemedText>
        <ThemedText style={styles.age}>{age} years old</ThemedText>
        <View style={[styles.statusPill, statusPillStyle]}>
          {connectionStatus === 'connecting' ? (
            <ActivityIndicator size="small" color={GuardianColors.primary} style={styles.pillSpinner} />
          ) : null}
          <ThemedText style={[styles.statusText, statusTextStyle]}>{statusLabel}</ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${child.name}`}
          hitSlop={8}
          disabled={isDeleting}
          onPress={(e) => {
            e.stopPropagation?.();
            onEdit?.();
          }}
          style={[styles.actionBtn, isDeleting && styles.actionBtnDisabled]}>
          <Ionicons name="create-outline" size={20} color={GuardianColors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${child.name}`}
          hitSlop={8}
          disabled={isDeleting}
          onPress={(e) => {
            e.stopPropagation?.();
            handleDelete();
          }}
          style={[styles.actionBtn, isDeleting && styles.actionBtnDisabled]}>
          {isDeleting ? (
            <ActivityIndicator size="small" color={GuardianColors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={GuardianColors.text} />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  cardDeleting: {
    opacity: 0.65,
  },
  meta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  age: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
    gap: 6,
  },
  pillSpinner: {
    transform: [{ scale: 0.75 }],
  },
  statusOnline: {
    backgroundColor: GuardianColors.safeMuted,
  },
  statusOffline: {
    backgroundColor: GuardianColors.dangerMuted,
  },
  statusConnecting: {
    backgroundColor: GuardianColors.navyMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statusTextOnline: {
    color: GuardianColors.safe,
  },
  statusTextOffline: {
    color: GuardianColors.danger,
  },
  statusTextConnecting: {
    color: GuardianColors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.overlaySheet,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
});

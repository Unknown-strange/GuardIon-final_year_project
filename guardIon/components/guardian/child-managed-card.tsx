import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  child: ChildSummary;
  age: number;
  imageUri?: string | null;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ChildManagedCard({ child, age, imageUri, onPress, onEdit, onDelete }: Props) {
  const online = child.online;

  const handleDelete = () => {
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

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}>
      <ChildAvatar childId={child.id} size={64} borderRadius={14} imageUri={imageUri} />

      <View style={styles.meta}>
        <ThemedText style={styles.name}>{child.name}</ThemedText>
        <ThemedText style={styles.age}>{age} years old</ThemedText>
        <View style={[styles.statusPill, online ? styles.statusOnline : styles.statusOffline]}>
          <ThemedText style={[styles.statusText, online ? styles.statusTextOnline : styles.statusTextOffline]}>
            {online ? 'ONLINE' : 'OFFLINE'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${child.name}`}
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            onEdit?.();
          }}
          style={styles.actionBtn}>
          <Ionicons name="create-outline" size={20} color={GuardianColors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${child.name}`}
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            handleDelete();
          }}
          style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={20} color={GuardianColors.text} />
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
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  statusOnline: {
    backgroundColor: GuardianColors.safeMuted,
  },
  statusOffline: {
    backgroundColor: GuardianColors.dangerMuted,
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
});

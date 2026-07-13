import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';
import type { ChildContact } from '@/types/child-contact';

type Props = {
  contact: ChildContact;
  onPress: () => void;
  disabled?: boolean;
};

function contactIcon(type: ChildContact['type']) {
  switch (type) {
    case 'school':
      return 'school-outline' as const;
    case 'device':
      return 'watch-outline' as const;
    case 'emergency':
      return 'medical' as const;
    default:
      return 'person' as const;
  }
}

export function ContactRow({ contact, onPress, disabled }: Props) {
  const isEmergency = contact.type === 'emergency';
  const noPhone = !contact.phone.trim();
  const relationship = contact.role?.trim();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || noPhone}
      onPress={onPress}
      style={[styles.row, (disabled || noPhone) && styles.rowDisabled]}>
      <View style={[styles.avatar, isEmergency && styles.avatarEmergency]}>
        <Ionicons
          name={contactIcon(contact.type)}
          size={20}
          color={isEmergency ? GuardianColors.danger : GuardianColors.primary}
        />
      </View>
      <View style={styles.meta}>
        <ThemedText style={styles.name}>{contact.name}</ThemedText>
        {relationship ? (
          <ThemedText style={styles.relationship}>{relationship}</ThemedText>
        ) : null}
        <ThemedText style={styles.phone}>
          {noPhone ? 'No number on file' : contact.phone.trim()}
        </ThemedText>
      </View>
      <View style={[styles.phoneBtn, isEmergency ? styles.phoneRed : styles.phoneBlue]}>
        <Ionicons name="call" size={18} color={isEmergency ? '#FFFFFF' : GuardianColors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmergency: {
    backgroundColor: GuardianColors.dangerMuted,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 16,
  },
  relationship: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  phone: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  phoneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBlue: {
    backgroundColor: GuardianColors.navyMuted,
  },
  phoneRed: {
    backgroundColor: GuardianColors.danger,
  },
});

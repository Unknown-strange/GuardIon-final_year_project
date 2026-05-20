import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  getEmergencyContactInitials,
  type EmergencyContact,
} from '@/constants/emergency-contacts-mocks';
import { GuardianColors, Typography } from '@/constants/theme';
import { formatPhoneDisplay } from '@/utils/phone';

type Props = {
  contact: EmergencyContact;
  onCall: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function EmergencyContactCard({ contact, onCall, onEdit, onDelete }: Props) {
  const initials = getEmergencyContactInitials(contact.name);
  const avatarColor = contact.avatarColor ?? GuardianColors.primary;
  const hasPhone = contact.phone.trim().length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.initials}>
            {initials}
          </ThemedText>
        </View>

        <View style={styles.meta}>
          <ThemedText style={styles.name}>{contact.name}</ThemedText>
          <ThemedText style={styles.relationship}>{contact.relationship}</ThemedText>
          <ThemedText style={styles.phone}>
            {hasPhone ? formatPhoneDisplay(contact.phone) : 'No number on file'}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call ${contact.name}`}
          disabled={!hasPhone}
          onPress={onCall}
          style={[styles.callBtn, !hasPhone && styles.callBtnDisabled]}>
          <Ionicons name="call" size={18} color={GuardianColors.primary} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${contact.name}`}
          onPress={onEdit}
          style={styles.editBtn}>
          <Ionicons name="create-outline" size={16} color={GuardianColors.textSecondary} />
          <ThemedText style={styles.editText}>Edit</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${contact.name}`}
          onPress={onDelete}
          style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={GuardianColors.danger} />
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
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
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnDisabled: {
    opacity: 0.45,
  },
  divider: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: GuardianColors.overlaySheet,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  editText: {
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: GuardianColors.dangerMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.danger,
  },
});

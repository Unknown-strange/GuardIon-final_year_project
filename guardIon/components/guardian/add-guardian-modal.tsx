import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import type { GuardianMember } from '@/constants/guardian-profile-mocks';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export type GuardianRole = 'primary' | 'secondary';

export type AddGuardianPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: GuardianRole;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onInvite: (payload: AddGuardianPayload) => void;
  onInvited?: () => void;
};

const ROLE_OPTIONS: { id: GuardianRole; title: string; hint: string }[] = [
  { id: 'primary', title: 'Primary', hint: 'Full control & alerts' },
  { id: 'secondary', title: 'Secondary', hint: 'View only access' },
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AddGuardianModal({ visible, onClose, onInvite, onInvited }: Props) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<GuardianRole>('primary');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('primary');
    setSubmitting(false);
  }, [visible]);

  const canInvite =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isValidEmail(email);

  const handleInvite = async () => {
    if (!canInvite) return;
    setSubmitting(true);
    try {
      onInvite({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
      });
      onClose();
      onInvited?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <ThemedText style={styles.headerTitle}>Add Guardian</ThemedText>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GuardianColors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.rule} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}>
            <ThemedText style={styles.sectionTitle}>Guardian Details</ThemedText>
            <ThemedText style={styles.sectionHint}>
              Invite a trusted adult to help monitor child safety. They will receive an invitation
              via email to join your circle.
            </ThemedText>

            <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Jane" />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="john.doe@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 24 123 4567"
              keyboardType="phone-pad"
            />

            <ThemedText style={[styles.sectionTitle, { marginTop: 8 }]}>Guardian Role</ThemedText>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setRole(option.id)}
                    style={[styles.roleCard, selected && styles.roleCardSelected]}>
                    <ThemedText style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
                      {option.title}
                    </ThemedText>
                    <ThemedText style={styles.roleHint}>{option.hint}</ThemedText>
                    {selected ? (
                      <View style={styles.roleCheck}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Invite via email'}
              onPress={handleInvite}
              disabled={!canInvite || submitting}
              loading={submitting}
            />
            <SecondaryButton label="Cancel" onPress={onClose} disabled={submitting} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={GuardianColors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        style={styles.input}
      />
    </View>
  );
}

export function payloadToGuardianMember(
  payload: AddGuardianPayload,
  id: string,
): GuardianMember {
  return {
    id,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    email: payload.email,
    role: payload.role === 'primary' ? 'Primary Guardian' : 'Secondary Guardian',
    isPrimary: payload.role === 'primary',
    avatarColor: payload.role === 'primary' ? GuardianColors.primary : '#2563EB',
    status: 'pending',
  };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: GuardianColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSide: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: GuardianColors.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginBottom: 16,
  },
  body: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.primary,
    marginBottom: 8,
  },
  sectionHint: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: GuardianColors.text,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.overlaySheet,
    padding: 14,
    minHeight: 96,
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: GuardianColors.primary,
    backgroundColor: GuardianColors.navyMuted,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: GuardianColors.text,
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: GuardianColors.primary,
  },
  roleHint: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    lineHeight: 17,
  },
  roleCheck: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
});

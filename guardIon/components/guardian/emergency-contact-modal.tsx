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
import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import type { EmergencyContact } from '@/constants/emergency-contacts-mocks';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export type EmergencyContactChildOption = {
  id: string;
  name: string;
  profilePhoto?: string;
};

export type EmergencyContactPayload = {
  childId: string;
  name: string;
  relationship: string;
  phone: string;
};

type Props = {
  visible: boolean;
  mode: 'add' | 'edit';
  children: EmergencyContactChildOption[];
  contact?: EmergencyContact | null;
  onClose: () => void;
  onSave: (payload: EmergencyContactPayload) => void;
  onSaved?: () => void;
};

const RELATIONSHIP_SUGGESTIONS = ['Aunt', 'Uncle', 'Grandparent', 'Neighbor', 'Family doctor', 'Other'];

export function EmergencyContactModal({
  visible,
  mode,
  children,
  contact,
  onClose,
  onSave,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && contact) {
      setSelectedChildId(contact.childId ?? children[0]?.id ?? '');
      setName(contact.name);
      setRelationship(contact.relationship);
      setPhone(contact.phone);
    } else {
      setSelectedChildId(children[0]?.id ?? '');
      setName('');
      setRelationship('');
      setPhone('');
    }
    setSubmitting(false);
  }, [visible, mode, contact, children]);

  const canSave =
    selectedChildId.length > 0 &&
    name.trim().length > 0 &&
    relationship.trim().length > 0 &&
    phone.trim().length >= 7;

  const handleSave = () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      onSave({
        childId: selectedChildId,
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
      });
      onClose();
      onSaved?.();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedChild =
    children.find((child) => child.id === selectedChildId) ?? children[0];

  const title = mode === 'add' ? 'Add Emergency Contact' : 'Edit Emergency Contact';
  const actionLabel = mode === 'add' ? 'Add contact' : 'Save changes';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GuardianColors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.rule} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}>
            <ThemedText style={styles.sectionHint}>
              {mode === 'add'
                ? 'Add someone who should be notified immediately during an SOS alert.'
                : 'Update this contact’s details so alerts reach the right person.'}
            </ThemedText>

            <ThemedText style={styles.fieldLabel}>Assign to child</ThemedText>
            {children.length === 0 ? (
              <ThemedText style={styles.noChildren}>
                Register a child first under Settings → Children.
              </ThemedText>
            ) : mode === 'add' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.childRow}>
                {children.map((child) => {
                  const selected = child.id === selectedChildId;
                  const colors = getChildColorTheme(child.id);
                  return (
                    <Pressable
                      key={child.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedChildId(child.id)}
                      style={[
                        styles.childCard,
                        {
                          borderColor: selected ? colors.main : GuardianColors.border,
                          backgroundColor: selected ? colors.muted : GuardianColors.surface,
                        },
                      ]}>
                      <ChildAvatar
                        childId={child.id}
                        size={44}
                        borderRadius={12}
                        imageUri={child.profilePhoto}
                        borderWidth={selected ? 2 : 0}
                        borderColor={selected ? colors.main : undefined}
                      />
                      <ThemedText
                        style={[styles.childName, selected && { color: colors.border }]}
                        numberOfLines={1}>
                        {child.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : selectedChild ? (
              <View style={styles.childCardReadonly}>
                <ChildAvatar
                  childId={selectedChild.id}
                  size={44}
                  borderRadius={12}
                  imageUri={selectedChild.profilePhoto}
                />
                <View style={styles.childReadonlyMeta}>
                  <ThemedText style={styles.childName}>{selectedChild.name}</ThemedText>
                  <ThemedText style={styles.childReadonlyHint}>Linked child</ThemedText>
                </View>
              </View>
            ) : null}

            <Field label="Full Name" value={name} onChangeText={setName} placeholder="Sarah Mitchell" />
            <Field
              label="Relationship"
              value={relationship}
              onChangeText={setRelationship}
              placeholder="Aunt, uncle, neighbor…"
            />

            <ThemedText style={styles.suggestionLabel}>Quick select</ThemedText>
            <View style={styles.chipRow}>
              {RELATIONSHIP_SUGGESTIONS.map((option) => {
                const selected = relationship === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setRelationship(option)}
                    style={[styles.chip, selected && styles.chipSelected]}>
                    <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 24 123 4567"
              keyboardType="phone-pad"
            />
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              label={submitting ? 'Saving…' : actionLabel}
              onPress={handleSave}
              disabled={!canSave || submitting}
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
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
        style={styles.input}
      />
    </View>
  );
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
    maxHeight: '94%',
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
    fontSize: 18,
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
  sectionHint: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  childRow: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 14,
  },
  childCard: {
    width: 108,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  childName: {
    fontSize: 13,
    fontWeight: '800',
    color: GuardianColors.text,
    textAlign: 'center',
    maxWidth: 88,
  },
  childCardReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.overlaySheet,
    marginBottom: 14,
  },
  childReadonlyMeta: {
    flex: 1,
    gap: 2,
  },
  childReadonlyHint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
  noChildren: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginBottom: 14,
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
  suggestionLabel: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.surface,
  },
  chipSelected: {
    borderColor: GuardianColors.primary,
    backgroundColor: GuardianColors.navyMuted,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: GuardianColors.textSecondary,
  },
  chipTextSelected: {
    color: GuardianColors.primary,
  },
  actions: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
});

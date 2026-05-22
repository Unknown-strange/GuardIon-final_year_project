import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

import type { ChildGender, RegisterChildPayload } from '@/components/guardian/add-child-modal';
import { ChildPhotoPicker } from '@/components/guardian/child-photo-picker';
import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { calculateAgeFromBirthDate, formatBirthDateShort } from '@/utils/child-age';
import { childFormFromSummary } from '@/utils/child-form';
import { pickChildPhoto } from '@/utils/pick-child-photo';

export type EditChildPayload = RegisterChildPayload;

type Props = {
  visible: boolean;
  child: ChildSummary | null;
  avatarUri?: string | null;
  onClose: () => void;
  onSave: (childId: string, payload: EditChildPayload) => void;
  onSaved?: () => void;
};

const GENDER_OPTIONS: { id: ChildGender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export function EditChildModal({ visible, child, avatarUri, onClose, onSave, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [gender, setGender] = useState<ChildGender>('male');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !child) return;
    const form = childFormFromSummary(child);
    setFirstName(form.firstName);
    setLastName(form.lastName);
    setBirthDate(form.birthDate);
    setShowDatePicker(false);
    setDeviceId(form.deviceId);
    setGender(form.gender);
    setPhotoUri(avatarUri ?? null);
    setSubmitting(false);
  }, [visible, child, avatarUri]);

  const canSave =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    deviceId.trim().length >= 4 &&
    calculateAgeFromBirthDate(birthDate) < 18;

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') return;
    }
    if (selected) setBirthDate(selected);
  };

  const openDatePicker = () => setShowDatePicker(true);

  const handleSave = () => {
    if (!child || !canSave) return;
    setSubmitting(true);
    try {
      onSave(child.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: birthDate,
        gender,
        deviceId: deviceId.trim(),
        avatarUri: photoUri ?? undefined,
      });
      onClose();
      onSaved?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!child) return null;

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <ThemedText style={styles.headerTitle}>Edit Child</ThemedText>
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
              Update this child&apos;s profile and linked device information.
            </ThemedText>

            <ChildPhotoPicker
              label="Add Photo"
              childId={child.id}
              imageUri={photoUri}
              onPick={async () => {
                const uri = await pickChildPhoto();
                if (uri) setPhotoUri(uri);
              }}
            />

            <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Enter last name" />

            <ThemedText style={styles.fieldLabel}>Date of Birth</ThemedText>
            <Pressable style={styles.dateField} onPress={openDatePicker}>
              <ThemedText style={styles.dateText}>{formatBirthDateShort(birthDate)}</ThemedText>
              <Ionicons name="calendar-outline" size={20} color={GuardianColors.primary} />
            </Pressable>
            {Platform.OS === 'ios' && showDatePicker ? (
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  themeVariant="light"
                  textColor={GuardianColors.text}
                  accentColor={GuardianColors.primary}
                  onChange={onDateChange}
                  style={styles.iosDatePicker}
                />
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.dateDone}>
                  <ThemedText style={styles.dateDoneText}>Done</ThemedText>
                </Pressable>
              </View>
            ) : null}

            <Field
              label="Device ID"
              value={deviceId}
              onChangeText={setDeviceId}
              placeholder="Enter device serial number"
              autoCapitalize="characters"
            />

            <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setGender(option.id)}
                    style={[styles.genderChip, selected && styles.genderChipSelected]}>
                    <ThemedText style={[styles.genderText, selected && styles.genderTextSelected]}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Save changes'}
              onPress={handleSave}
              disabled={!canSave || submitting}
              loading={submitting}
            />
            <SecondaryButton label="Cancel" onPress={onClose} disabled={submitting} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {visible && showDatePicker && Platform.OS === 'android' ? (
      <DateTimePicker
        value={birthDate}
        mode="date"
        display="default"
        maximumDate={new Date()}
        onChange={onDateChange}
      />
    ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
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
        autoCapitalize={autoCapitalize ?? 'words'}
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
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  dateText: {
    fontSize: 15,
    color: GuardianColors.text,
    fontWeight: '600',
  },
  dateDone: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dateDoneText: {
    color: GuardianColors.primary,
    fontWeight: '800',
  },
  iosPickerWrap: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  iosDatePicker: {
    width: '100%',
    minHeight: 320,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.surface,
  },
  genderChipSelected: {
    borderColor: GuardianColors.primary,
    backgroundColor: GuardianColors.navyMuted,
  },
  genderText: {
    fontWeight: '800',
    color: GuardianColors.textSecondary,
    fontSize: 14,
  },
  genderTextSelected: {
    color: GuardianColors.primary,
  },
  actions: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
});

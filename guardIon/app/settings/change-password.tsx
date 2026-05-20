import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/guardian/buttons';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const canSave =
    currentPassword.length >= 6 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword;

  const handleSave = () => {
    if (!canSave) return;

    if (newPassword === currentPassword) {
      Alert.alert('Choose a different password', 'Your new password must be different from the current one.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToastVisible(true);
    }, 600);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Change Password</ThemedText>
          <View style={styles.headerBtnSpacer} />
        </View>

        <View style={styles.headerRule} />

        <ThemedText style={styles.lead}>
          Use a strong password with at least 8 characters. You will stay signed in on this device.
        </ThemedText>

        <View style={styles.formCard}>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent((v) => !v)}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            visible={showNew}
            onToggleVisible={() => setShowNew((v) => !v)}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((v) => !v)}
            placeholder="Re-enter new password"
            isLast
          />
        </View>

        <PrimaryButton
          label={submitting ? 'Updating…' : 'Update password'}
          onPress={handleSave}
          disabled={!canSave || submitting}
          loading={submitting}
        />
      </ScrollView>

      <GuardianToast
        visible={toastVisible}
        message="Password updated successfully"
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
  placeholder,
  isLast,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.field, !isLast && styles.fieldBorder]}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={GuardianColors.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={onToggleVisible}
          hitSlop={8}
          style={styles.eyeBtn}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={GuardianColors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnSpacer: {
    width: 44,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 20,
    color: GuardianColors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRule: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginBottom: 18,
    opacity: 0.8,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: GuardianColors.textSecondary,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: GuardianColors.border,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.primary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: GuardianColors.text,
  },
  eyeBtn: {
    padding: 4,
  },
});

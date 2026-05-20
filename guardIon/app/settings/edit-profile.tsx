import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { updateUserProfile } from '@/api/users';
import { getErrorMessage } from '@/api/errors';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { GuardianColors, Typography } from '@/constants/theme';

export default function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhoneNumber(user?.phone_number ?? '');
  }, [user]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your full name.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
      });
      await refreshProfile();
      setToastVisible(true);
    } catch (error) {
      Alert.alert('Save failed', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSubScreen
      title="Edit Profile"
      subtitle="Update your guardian account details.">
      <View style={styles.card}>
        <ThemedText style={styles.label}>Full name</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor={GuardianColors.textMuted}
        />

        <ThemedText style={[styles.label, { marginTop: 16 }]}>Email</ThemedText>
        <TextInput
          value={user?.email ?? ''}
          editable={false}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, styles.inputDisabled]}
          placeholderTextColor={GuardianColors.textMuted}
        />

        <ThemedText style={[styles.label, { marginTop: 16 }]}>Phone number</ThemedText>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor={GuardianColors.textMuted}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onSave}
        disabled={saving}
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <ThemedText style={styles.saveBtnText}>Save changes</ThemedText>
        )}
      </Pressable>

      <GuardianToast
        visible={toastVisible}
        message="Profile updated"
        onHide={() => setToastVisible(false)}
      />
    </SettingsSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GuardianColors.text,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
});

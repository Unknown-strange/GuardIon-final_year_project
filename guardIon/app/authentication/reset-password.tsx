import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getErrorMessage } from '@/contexts/auth-context';
import { resetPassword } from '@/lib/api/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();

  const email = useMemo(() => {
    try {
      return params.email ? decodeURIComponent(String(params.email)).trim().toLowerCase() : '';
    } catch {
      return String(params.email || '').trim().toLowerCase();
    }
  }, [params.email]);

  const code = useMemo(() => {
    try {
      return params.code ? decodeURIComponent(String(params.code)) : '';
    } catch {
      return String(params.code || '');
    }
  }, [params.code]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !code) {
      Alert.alert('Session expired', 'Request a new reset code and try again.');
      router.replace('/authentication/forgot-password' as any);
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, code, password);
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/authentication/signin' as any) },
      ]);
    } catch (error) {
      Alert.alert('Reset failed', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
            </Pressable>
            <ThemedText style={styles.title}>Create new password</ThemedText>
            <ThemedText style={styles.subtitle}>
              Choose a strong password for {email || 'your account'}.
            </ThemedText>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={GuardianColors.textMuted}
              secureTextEntry={secure}
              style={styles.input}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor={GuardianColors.textMuted}
              secureTextEntry={secure}
              style={[styles.input, { marginTop: 12 }]}
            />

            <Pressable onPress={() => setSecure((v) => !v)} style={styles.toggle}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color={GuardianColors.textMuted} />
              <ThemedText style={styles.toggleText}>{secure ? 'Show passwords' : 'Hide passwords'}</ThemedText>
            </Pressable>

            <Pressable onPress={onSubmit} disabled={submitting} style={[styles.btn, submitting && { opacity: 0.7 }]}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.btnText}>Update password</ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GuardianColors.atmosphereBlue },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '900', color: GuardianColors.text },
  subtitle: { marginTop: 10, marginBottom: 24, color: GuardianColors.textSecondary, lineHeight: 22 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  toggleText: { color: GuardianColors.textSecondary, fontWeight: '600' },
  btn: {
    marginTop: 24,
    height: 52,
    borderRadius: 26,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getErrorMessage } from '@/contexts/auth-context';
import { forgotPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const onSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Email required', 'Enter the email linked to your account.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(normalizedEmail);
      router.replace(
        `/authentication/verify-otp?email=${encodeURIComponent(normalizedEmail)}&purpose=password_reset` as any,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        showToast('No account found for this email.');
        return;
      }
      if (error instanceof ApiError && error.status >= 500) {
        showToast('Server error. Please try again in a moment.');
        return;
      }
      Alert.alert('Request failed', getErrorMessage(error));
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
            <ThemedText style={styles.title}>Forgot password?</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your email and we&apos;ll send a verification code to reset your password.
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={GuardianColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable onPress={onSubmit} disabled={submitting} style={[styles.btn, submitting && { opacity: 0.7 }]}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>Send code</ThemedText>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <GuardianToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GuardianColors.atmosphereBlue },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: GuardianColors.text },
  subtitle: { marginTop: 10, marginBottom: 24, color: GuardianColors.textSecondary, lineHeight: 22 },
  input: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: GuardianColors.border, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  btn: { marginTop: 20, height: 52, borderRadius: 26, backgroundColor: GuardianColors.primary, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

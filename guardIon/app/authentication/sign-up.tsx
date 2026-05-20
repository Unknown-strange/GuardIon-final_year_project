import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getErrorMessage } from '@/contexts/auth-context';
import { GoogleSignInButton } from '@/components/authentication/google-sign-in-button';
import { signupRequest } from '@/lib/api/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onCreateAccount = async () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name || !email.trim() || !password) {
      Alert.alert('Missing details', 'Fill in your name, email, and password.');
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
    if (!agree) {
      Alert.alert('Terms required', 'Please accept the terms to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await signupRequest({
        name,
        email,
        password,
        phone_number: phone.trim() || undefined,
      });
      router.replace(
        `/authentication/verify-otp?email=${encodeURIComponent(email.trim())}&purpose=signup` as any,
      );
    } catch (error) {
      Alert.alert('Sign up failed', getErrorMessage(error, 'Unable to start registration.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safe}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/guardion-logo.png')}
                style={styles.logo}
                contentFit="contain"
                transition={0}
              />
            </View>

            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Register to start monitoring safely</ThemedText>

            <View style={styles.form}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <ThemedText style={[styles.label, { marginTop: 16 }]}>Last Name</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <ThemedText style={[styles.label, { marginTop: 16 }]}>
                Email address/Username
              </ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="helloworld@gmail.com"
                  placeholderTextColor="#9CA3AF"
                />
                {email.length > 0 ? (
                  <View style={styles.trailingIconWrap}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>

              <ThemedText style={[styles.label, { marginTop: 16 }]}>Phone Number</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <ThemedText style={[styles.label, { marginTop: 16 }]}>Password</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={securePassword}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle password visibility"
                  hitSlop={10}
                  onPress={() => setSecurePassword((v) => !v)}
                  style={styles.trailingIconWrap}>
                  <Ionicons
                    name={securePassword ? 'eye-off' : 'eye'}
                    size={16}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <ThemedText style={[styles.label, { marginTop: 16 }]}>Confirm Password</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={secureConfirm}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle confirm password visibility"
                  hitSlop={10}
                  onPress={() => setSecureConfirm((v) => !v)}
                  style={styles.trailingIconWrap}>
                  <Ionicons
                    name={secureConfirm ? 'eye-off' : 'eye'}
                    size={16}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <View style={styles.agreeRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel="Agree to terms"
                  onPress={() => setAgree((v) => !v)}
                  style={styles.agreeLeft}>
                  <View style={[styles.checkbox, agree ? styles.checkboxChecked : undefined]}>
                    {agree ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                </Pressable>
                <ThemedText style={styles.agreeText}>
                  I agree to the{' '}
                  <ThemedText style={styles.inlineLink}>Terms and Conditions</ThemedText> and{' '}
                  <ThemedText style={styles.inlineLink}>Privacy Policy</ThemedText>
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={onCreateAccount}
                disabled={submitting}
                style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryBtnText}>Sign up</ThemedText>
                )}
              </Pressable>

              <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <ThemedText style={styles.separatorText}>Or Login with</ThemedText>
                <View style={styles.separatorLine} />
              </View>

              <GoogleSignInButton
                disabled={submitting}
                onSuccess={() => router.replace('/(tabs)')}
                style={styles.googleBtn}
              />

              <View style={styles.bottomRow}>
                <ThemedText style={styles.bottomText}>Already have an account?</ThemedText>
                <Pressable accessibilityRole="link" onPress={() => router.back()}>
                  <ThemedText style={styles.bottomLink}>Log in</ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 18,
    paddingBottom: 26,
  },
  header: {
    marginTop: 8,
  },
  logo: {
    width: 100,
    height: 74,
  },
  title: {
    marginTop: 20,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#000000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 380,
    marginTop: 22,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  inputShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  trailingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0B2D5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  agreeRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agreeLeft: {
    padding: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0B2D5B',
    borderColor: '#0B2D5B',
  },
  agreeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },
  inlineLink: {
    color: '#0B2D5B',
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 18,
    width: '100%',
    height: 56,
    borderRadius: 30,
    backgroundColor: '#072B59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  separatorRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D3E3F4',
  },
  separatorText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  googleBtn: {
    marginTop: 16,
    width: '100%',
    height: 54,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3E3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomLink: {
    fontSize: 14,
    color: '#0B2D5B',
    fontWeight: '800',
  },
});


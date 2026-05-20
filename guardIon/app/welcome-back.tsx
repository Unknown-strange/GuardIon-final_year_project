import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

export default function WelcomeBackScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  const onLogin = () => router.replace('/(tabs)');
  const onSignUp = () => router.push('/authentication/sign-up');

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

            <ThemedText style={styles.title}>Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue monitoring your child
            </ThemedText>

            <View style={styles.form}>
              <ThemedText style={styles.label}>Email address/Username</ThemedText>
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

              <ThemedText style={[styles.label, { marginTop: 18 }]}>Password</ThemedText>
              <View style={styles.inputShell}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={secureTextEntry}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle password visibility"
                  hitSlop={10}
                  onPress={() => setSecureTextEntry((v) => !v)}
                  style={styles.trailingIconWrap}>
                  <Ionicons
                    name={secureTextEntry ? 'eye-off' : 'eye'}
                    size={16}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <View style={styles.optionsRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel="Remember me"
                  onPress={() => setRememberMe((v) => !v)}
                  style={styles.rememberRow}>
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe ? styles.checkboxChecked : undefined,
                    ]}>
                    {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <ThemedText style={styles.rememberText}>Remember me</ThemedText>
                </Pressable>

                <Pressable accessibilityRole="link" onPress={() => {}}>
                  <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
                </Pressable>
              </View>

              <Pressable accessibilityRole="button" onPress={onLogin} style={styles.loginBtn}>
                <ThemedText style={styles.loginBtnText}>Log in</ThemedText>
              </Pressable>

              <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <ThemedText style={styles.separatorText}>Or Login with</ThemedText>
                <View style={styles.separatorLine} />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={styles.googleBtn}>
                <Ionicons name="logo-google" size={22} color="#111827" />
              </Pressable>

              <View style={styles.signupRow}>
                <ThemedText style={styles.signupText}>Don&apos;t have an account?</ThemedText>
                <Pressable accessibilityRole="link" onPress={onSignUp}>
                  <ThemedText style={styles.signupLink}>Sign up</ThemedText>
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
    backgroundColor: '#EAF4FF',
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
    fontSize: 36,
    lineHeight: 42,
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
    marginTop: 28,
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
    shadowOpacity: 0.10,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  rememberText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: '#0B2D5B',
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    backgroundColor: '#072B59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  separatorRow: {
    marginTop: 22,
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
  signupRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#0B2D5B',
    fontWeight: '800',
  },
});

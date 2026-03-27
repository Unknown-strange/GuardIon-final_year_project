import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 20;

function formatSeconds(totalSeconds: number) {
  const mm = Math.max(0, Math.floor(totalSeconds / 60));
  const ss = Math.max(0, totalSeconds % 60);
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();

  const phoneLabel = useMemo(() => {
    return params.phone ? params.phone : '+33 2 94 27 84 11';
  }, [params.phone]);

  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const hiddenInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // For UI/demo purposes: once the user enters all digits, route them into the app.
    if (otp.length === OTP_LENGTH) {
      router.replace('/(tabs)' as any);
    }
  }, [otp.length, router]);

  const setDigit = (digit: string) => {
    if (!/^\d$/.test(digit)) return;
    setOtp((prev) => (prev.length >= OTP_LENGTH ? prev : prev + digit));
  };

  const backspace = () => {
    setOtp((prev) => prev.slice(0, -1));
  };

  const onResend = () => {
    // Placeholder: wire to your real resend OTP API later.
    setOtp('');
    setSecondsLeft(RESEND_SECONDS);
    hiddenInputRef.current?.focus();
  };

  const digits = otp.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  const keypadRows: Array<Array<{ key: string; digit?: string; disabled?: boolean }>> = [
    [{ key: '1', digit: '1' }, { key: '2', digit: '2' }, { key: '3', digit: '3' }],
    [{ key: '4', digit: '4' }, { key: '5', digit: '5' }, { key: '6', digit: '6' }],
    [{ key: '7', digit: '7' }, { key: '8', digit: '8' }, { key: '9', digit: '9' }],
    [
      { key: '+', disabled: true },
      { key: '*', disabled: true },
      { key: '#', disabled: true },
    ],
    [{ key: '', disabled: true }, { key: '0', digit: '0' }, { key: 'del' }],
  ];

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
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={12}
                onPress={() => router.back()}
                style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#0B2D5B" />
              </Pressable>
            </View>

            <View style={styles.headerCenter}>
              <Image
                source={require('@/assets/images/guardion-logo.png')}
                style={styles.logo}
                contentFit="contain"
                transition={0}
              />
            </View>

            <ThemedText style={styles.title}>Verify Your Account</ThemedText>
            <ThemedText style={styles.subtitle}>
              We&apos;ve sent an Email/SMS with an activation code to your phone{' '}
              {phoneLabel}
            </ThemedText>

            <View style={styles.otpRow}>
              <TextInput
                ref={hiddenInputRef}
                value={otp}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
                  setOtp(digitsOnly);
                }}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                autoFocus
                maxLength={OTP_LENGTH}
              />
              {digits.map((d, idx) => (
                <View key={idx} style={styles.otpBox}>
                  <ThemedText style={styles.otpText}>{d}</ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.resendRow}>
              <ThemedText style={styles.resendText}>
                Send code again <ThemedText style={styles.timerText}>{formatSeconds(secondsLeft)}</ThemedText>
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                disabled={secondsLeft > 0}
                onPress={onResend}
                style={secondsLeft > 0 ? styles.resendDisabled : styles.resendButton}>
                <ThemedText style={styles.resendButtonText}>Resend</ThemedText>
              </Pressable>
            </View>

            <View style={styles.keypad}>
              {keypadRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.keypadRow}>
                  {row.map((item) => {
                    if (item.key === 'del') {
                      return (
                        <Pressable
                          key={item.key}
                          accessibilityRole="button"
                          accessibilityLabel="Delete"
                          disabled={otp.length === 0}
                          onPress={backspace}
                          style={styles.keyButton}>
                          <Ionicons name="backspace-outline" size={20} color="#0B2D5B" />
                        </Pressable>
                      );
                    }

                    if (item.disabled || item.key === '') {
                      return (
                        <View key={item.key} style={[styles.keyButton, styles.keyButtonDisabled]} />
                      );
                    }

                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        onPress={() => setDigit(item.digit ?? '')}
                        style={styles.keyButton}>
                        <ThemedText style={styles.keyText}>{item.key}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 24,
  },
  topBar: {
    width: '100%',
    marginTop: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerCenter: {
    marginTop: 16,
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
  },
  title: {
    marginTop: 18,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: '#000000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  otpRow: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0B2D5B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B2D5B',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  resendRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  timerText: {
    color: '#0B2D5B',
    fontWeight: '900',
  },
  resendButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D3E3F4',
  },
  resendDisabled: {
    opacity: 0.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D3E3F4',
  },
  resendButtonText: {
    fontSize: 13,
    color: '#0B2D5B',
    fontWeight: '900',
  },
  keypad: {
    marginTop: 18,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D3E3F4',
  },
  keyButtonDisabled: {
    opacity: 0,
    borderWidth: 0,
  },
  keyText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B2D5B',
  },
});


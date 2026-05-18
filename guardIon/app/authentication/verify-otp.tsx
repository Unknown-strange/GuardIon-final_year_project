import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors } from '@/constants/theme';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 20;
const TOAST_MS = 1800;

function formatSeconds(totalSeconds: number) {
  const mm = Math.max(0, Math.floor(totalSeconds / 60));
  const ss = Math.max(0, totalSeconds % 60);
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

function emptyCells(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => '');
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phoneLabel = useMemo(() => {
    try {
      const raw = params.phone ? decodeURIComponent(String(params.phone)) : '';
      return raw || '+33 2 94 27 84 11';
    } catch {
      return String(params.phone || '+33 2 94 27 84 11');
    }
  }, [params.phone]);

  const [cells, setCells] = useState<string[]>(() => emptyCells());
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [toastVisible, setToastVisible] = useState(false);

  const otpComplete = cells.every((c) => c.length === 1);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => {
      setToastVisible(false);
      router.replace('/authentication/signin' as any);
    }, TOAST_MS);
    return () => clearTimeout(t);
  }, [toastVisible, router]);

  const handleCellChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    setCells((prev) => {
      const next = [...prev];

      if (cleaned.length === 0) {
        next[index] = '';
        return next;
      }

      if (cleaned.length > 1) {
        const chars = cleaned.slice(0, OTP_LENGTH - index).split('');
        for (let i = 0; i < chars.length && index + i < OTP_LENGTH; i++) {
          next[index + i] = chars[i] ?? '';
        }
        requestAnimationFrame(() => {
          const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1);
          inputRefs.current[nextFocus]?.focus();
        });
        return next;
      }

      next[index] = cleaned.slice(-1);
      if (cleaned && index < OTP_LENGTH - 1) {
        requestAnimationFrame(() => inputRefs.current[index + 1]?.focus());
      }
      return next;
    });
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key !== 'Backspace') return;
    setCells((prev) => {
      if (prev[index]) return prev;
      if (index === 0) return prev;
      const next = [...prev];
      next[index - 1] = '';
      requestAnimationFrame(() => inputRefs.current[index - 1]?.focus());
      return next;
    });
  };

  const onResend = () => {
    if (secondsLeft > 0) return;
    setCells(emptyCells());
    setSecondsLeft(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
  };

  const onVerify = () => {
    if (!otpComplete || toastVisible) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastVisible(true);
  };

  const canVerify = otpComplete && !toastVisible;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={12}
                onPress={() => router.back()}
                style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#0B2D5B" />
              </Pressable>
              <View style={styles.headerLogoCenter}>
                <Image
                  source={require('@/assets/images/guardion-logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                  transition={0}
                />
              </View>
              <View style={styles.headerSideSpacer} />
            </View>

            <ThemedText style={styles.title}>Verify Your Account</ThemedText>
            <ThemedText style={styles.subtitle}>
              We&apos;ve sent an Email/SMS with an activation code to your phone {phoneLabel}
            </ThemedText>

            <View style={styles.otpRow}>
              {cells.map((value, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  value={value}
                  onChangeText={(t) => handleCellChange(t, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  editable={!toastVisible}
                  accessibilityLabel={`Digit ${index + 1}`}
                  style={styles.otpInput}
                  placeholder=""
                  placeholderTextColor="#9CA3AF"
                  cursorColor="#072B59"
                  selectionColor="#072B59"
                  textAlign="center"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              ))}
            </View>

            <View style={styles.resendBlock}>
              <View style={styles.resendRowInner}>
                <ThemedText style={styles.resendPrefix}>I didn&apos;t receive a code </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                  disabled={secondsLeft > 0}
                  onPress={onResend}
                  hitSlop={8}>
                  <ThemedText
                    style={[styles.resendBold, secondsLeft > 0 && styles.resendBoldDisabled]}>
                    Resend
                  </ThemedText>
                </Pressable>
              </View>
              {secondsLeft > 0 ? (
                <ThemedText style={styles.resendTimer}>{formatSeconds(secondsLeft)}</ThemedText>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verify"
              disabled={!canVerify}
              onPress={onVerify}
              style={[styles.verifyBtn, !canVerify && styles.verifyBtnDisabled]}>
              <ThemedText style={styles.verifyBtnText}>Verify</ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {toastVisible ? (
          <View style={styles.toastOverlay} pointerEvents="none">
            <View style={styles.toast}>
              <ThemedText style={styles.toastText}>Verification complete</ThemedText>
            </View>
          </View>
        ) : null}
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 32,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
  headerLogoCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSideSpacer: {
    width: 44,
    height: 44,
  },
  logo: {
    width: 140,
    height: 44,
  },
  title: {
    marginTop: 20,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  otpRow: {
    marginTop: 28,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    maxWidth: 62,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
  },
  resendBlock: {
    marginTop: 20,
    alignItems: 'center',
    gap: 6,
  },
  resendRowInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendPrefix: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resendBold: {
    fontWeight: '800',
    color: '#111827',
  },
  resendBoldDisabled: {
    color: '#9CA3AF',
  },
  resendTimer: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  verifyBtn: {
    marginTop: 28,
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#072B59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.45,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
    backgroundColor: 'transparent',
  },
  toast: {
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    maxWidth: '88%',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

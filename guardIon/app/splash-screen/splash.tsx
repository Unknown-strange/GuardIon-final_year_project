import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { GuardianColors } from '@/constants/theme';
import { isOnboardingComplete } from '@/lib/storage/onboarding';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRoutedRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading || hasRoutedRef.current) return;

    const route = async () => {
      hasRoutedRef.current = true;

      if (isAuthenticated) {
        router.replace('/(tabs)');
        return;
      }

      const onboardingDone = await isOnboardingComplete();
      if (onboardingDone) {
        router.replace('/authentication/signin');
        return;
      }

      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        router.replace('/splash-screen/onboarding-one');
      }, 1200);
    };

    void route();

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [isAuthenticated, isLoading, router]);

  const skipToSignIn = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    router.replace('/authentication/signin');
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={GuardianColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.center}>
        <Image
          source={require('@/assets/images/guardion-logo.png')}
          style={styles.logo}
          contentFit="contain"
          transition={0}
        />

        <ThemedText style={styles.tagline}>
          An Edge-Intelligent Multi-Sensor Wearable System{'\n'}for Child Safety Monitoring
        </ThemedText>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Pressable onPress={skipToSignIn}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GuardianColors.splashBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loading: {
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 240,
    height: 150,
    marginTop: 13,
  },
  tagline: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: '#1F2A37',
    opacity: 0.9,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B7C7D6',
    opacity: 0.95,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  skipText: {
    marginTop: 4,
    fontSize: 12,
    color: '#0B2D5B',
  },
});

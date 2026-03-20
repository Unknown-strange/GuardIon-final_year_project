import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/onboarding-one');
    }, 1200);

    return () => clearTimeout(t);
  }, [router]);

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

      <Pressable onPress={() => router.replace('/onboarding-one')}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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


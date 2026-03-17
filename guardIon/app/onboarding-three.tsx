import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OnboardingThreeScreen() {
  const router = useRouter();

  const goNext = () => router.replace('/(tabs)');
  const goBack = () => router.back();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={goBack}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0B2D5B" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Image
              source={require('@/assets/images/guardion-logo.png')}
              style={styles.headerLogo}
              contentFit="contain"
              transition={0}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            hitSlop={12}
            onPress={goNext}
            style={styles.headerSide}>
            <ThemedText style={styles.headerAction}>Skip</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.illustrationCard}>
            <Image
              source={require('@/assets/images/onboarding-three.png')}
              style={styles.illustration}
              contentFit="contain"
              transition={0}
            />
          </View>

          <ThemedText style={styles.title}>Peace of Mind, Anywhere</ThemedText>
          <ThemedText style={styles.subtitle}>
            Stay connected to your child at all times with secure cloud-based monitoring and
            emergency response features.
          </ThemedText>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={goNext} style={styles.button}>
            <ThemedText style={styles.buttonText}>Next</ThemedText>
          </Pressable>
        </View>
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
  header: {
    paddingHorizontal: 30,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D3E3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: {
    width: 64,
    height: 36,
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 72,
    height: 72,
  },
  headerAction: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0B2D5B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: 24,
  },
  illustrationCard: {
    width: 330,
    height: 352,
    marginLeft: 60,
    marginTop: 5,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 28,
    fontSize: 38,
    lineHeight: 52,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0B2D5B',
    paddingHorizontal: 49,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15.5,
    lineHeight: 18,
    textAlign: 'center',
    color: '#0B2D5B',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 340,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#072B59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

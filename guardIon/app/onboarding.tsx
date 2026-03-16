import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OnboardingScreen() {
  const router = useRouter();

  const goNext = () => router.replace('/(tabs)');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerSide} />

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

        <View style={styles.content}>
          <View style={styles.card}>
            <Image
              source={require('@/assets/images/onboarding-illustration.png')}
              style={styles.hero}
              contentFit="cover"
              transition={0}
            />
          </View>

          <View style={styles.infoStack}>
            <View style={styles.infoCardHeart}>
              <View style={styles.heartRow}>
                <View style={styles.heartIcon}>
                  <ThemedText style={styles.heartIconText}>♡</ThemedText>
                </View>
                <ThemedText style={styles.heartLabel}>Heart Rate</ThemedText>
              </View>
              <View style={styles.heartValueRow}>
                <ThemedText style={styles.heartValue}>72</ThemedText>
                <ThemedText style={styles.heartUnit}>BPM</ThemedText>
              </View>
            </View>

            <View style={styles.infoCardLocation}>
              <View style={styles.locRow}>
                <View style={styles.locIcon}>
                  <Image
                    source={require('@/assets/images/location-pin.png')}
                    style={styles.locIconImg}
                    contentFit="contain"
                    transition={0}
                  />
                </View>
                <View style={styles.locText}>
                  <ThemedText style={styles.locLabel}>Current Location</ThemedText>
                  <ThemedText style={styles.locTitle}>Central Park, North</ThemedText>
                  <ThemedText style={styles.locStatus}>Safe Zone</ThemedText>
                </View>
              </View>
            </View>
          </View>

          <ThemedText style={styles.title}>Real-Time Monitoring</ThemedText>
          <ThemedText style={styles.subtitle}>
            Monitor your child’s location, movement, and{'\n'}vital signals in real time using intelligent sensor
            technology.
          </ThemedText>
        </View>

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
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 64,
    height: 36,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: '#0B2D5B',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 100,
    height: 100,
  },
  headerAction: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#0B2D5B',
    marginRight: 20, 
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    width: '92%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F6FAFF',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  infoStack: {
    width: '92%',
    maxWidth: 360,
    marginTop: 14,
    gap: 12,
  },
  infoCardHeart: {
    marginTop: -89,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8EC',
  },
  heartIconText: {
    fontSize: 12,
    lineHeight: 12,
    color: '#E11D48',
  },
  heartLabel: {
    fontSize: 12.5,
    color: '#111827',
    opacity: 0.7,
    fontWeight: '600',
  },
  heartValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  heartValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B2D5B',
  },
  heartUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B2D5B',
    opacity: 0.55,
  },
  infoCardLocation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 14,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locIcon: {
    width: 40,
    height: 39,
    borderRadius: 10,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locIconImg: {
    width: 35,
    height: 35,
  },
  locIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  locText: {
    flex: 1,
  },
  locLabel: {
    fontSize: 10.5,
    color: '#111827',
    opacity: 0.55,
    fontWeight: '700',
  },
  locTitle: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0B2D5B',
  },
  locStatus: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  title: {
    marginTop: 79,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0B2D5B',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    color: '#0B2D5B',
    opacity: 0.9,
    paddingHorizontal: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dot: {
    width: 18,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#D3E3F4',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  button: {
    width: '80%',
    maxWidth: 340,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#072B59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});


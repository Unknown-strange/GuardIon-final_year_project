import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OnboardingTwoScreen() {
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
            <Ionicons name="chevron-back" size={24} color="#1F2A37" />
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
          <View style={styles.mapCard}>
            <Image
              source={require('@/assets/images/onboarding-map.png')}
              style={styles.mapImage}
              contentFit="contain"
              transition={0}
            />
          </View>

          <View style={styles.alertStack}>
            <View style={styles.criticalAlertCard}>
              <View style={styles.criticalAlertBorder} />
              <View style={styles.criticalAlertContent}>
                <View style={styles.criticalAlertHeader}>
                  <View style={styles.warningIconWrap}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                  </View>
                  <ThemedText style={styles.criticalAlertLabel}>Critical Alert</ThemedText>
                </View>
                <ThemedText style={styles.criticalAlertTitle}>Danger: Geofence Breach</ThemedText>
                <ThemedText style={styles.criticalAlertDesc}>
                  Leo has left the Safe Zone: School Campus.
                </ThemedText>
                <Pressable style={styles.viewDetailsButton}>
                  <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.heartRateAlertCard}>
              <View style={styles.heartRateRow}>
                <View style={styles.heartRateIconWrap}>
                  <Ionicons name="pulse" size={20} color="#4B5563" />
                </View>
                <View style={styles.heartRateText}>
                  <ThemedText style={styles.heartRateLabel}>Abnormal Heart Rate</ThemedText>
                  <ThemedText style={styles.heartRateValue}>128 BPM - Elevated level detected.</ThemedText>
                </View>
                <View style={styles.heartRateDot} />
              </View>
            </View>
          </View>

          <ThemedText style={styles.title}>Instant Smart Alerts</ThemedText>
          <ThemedText style={styles.subtitle}>
            Receive immediate alerts for unusual activity, geofence breaches, or abnormal vital signs
            powered by intelligent risk detection algorithms.
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
    paddingHorizontal: 18,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  mapCard: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    maxHeight: 350,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F6FAFF',
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    alignSelf: 'center',
  },
  mapImage: {
    width: '100%',
    height: '73%',
  },
  alertStack: {
    width: '86.5%',
    maxWidth: 360,
    marginTop: -120,
    gap: 12,
    alignSelf: 'center',
  },
  criticalAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    paddingLeft: 0,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  criticalAlertBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#DC2626',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  criticalAlertContent: {
    paddingVertical: 0,
    paddingHorizontal: 16,
    paddingLeft: 20,
  },
  criticalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalAlertLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  criticalAlertTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#0B2D5B',
  },
  criticalAlertDesc: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  viewDetailsButton: {
    alignSelf: 'flex-end',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 200,
    backgroundColor: '#072B59',
  },
  viewDetailsText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  heartRateAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0B2D5B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heartRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heartRateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartRateText: {
    flex: 1,
  },
  heartRateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2A37',
  },
  heartRateValue: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  heartRateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EC4899',
  },
  title: {
    marginTop: 80,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0B2D5B',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    color: '#0B2D5B',
    opacity: 0.9,
    paddingHorizontal: 8,
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

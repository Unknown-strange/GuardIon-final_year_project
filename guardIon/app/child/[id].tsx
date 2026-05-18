import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardianFab } from '@/components/guardian/fab';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getChildDashboard } from '@/constants/guardian-mocks';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dash = getChildDashboard(String(id ?? '1'));

  return (
    <ThemedView style={styles.screen}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Layout.screenPadding,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
            </Pressable>
          </View>

          <ScreenHeader subtitle={`${dash.childName}'s Dashboard`} />

          <View style={styles.profileBlock}>
            <View style={styles.profileRing}>
              <View style={styles.profileInner}>
                <Ionicons name="person" size={42} color={GuardianColors.primary} />
              </View>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText style={styles.profileName}>{dash.childName}</ThemedText>
            <ThemedText style={styles.profileMeta}>
              Age {dash.age} ·{' '}
              <ThemedText style={styles.metaGreen}>{dash.tagline}</ThemedText>
            </ThemedText>
            <View style={styles.quickRow}>
              <Pressable style={styles.btnDark}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.btnDarkText}>
                  Check-in
                </ThemedText>
              </Pressable>
              <Pressable style={styles.btnLight}>
                <Ionicons name="call-outline" size={20} color={GuardianColors.primary} />
                <ThemedText style={styles.btnLightText}>Call</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <ThemedText style={styles.cardTitle}>Live Location</ThemedText>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <ThemedText style={styles.liveText}>Live Now</ThemedText>
              </View>
            </View>
            <Image
              source={require('@/assets/mockups/child-details-dashboard.png')}
              style={styles.mapShot}
              contentFit="cover"
            />
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={18} color={GuardianColors.primary} />
              <View>
                <ThemedText style={styles.addr}>{dash.liveAddress}</ThemedText>
                <ThemedText style={styles.timeSmall}>Last updated {dash.liveUpdated}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.riskCard}>
            <View>
              <ThemedText style={styles.riskLabel}>SAFETY RISK LEVEL</ThemedText>
              <ThemedText style={styles.riskValue}>{dash.riskLabel}</ThemedText>
            </View>
            <View style={styles.ringScore}>
              <ThemedText style={styles.ringScoreText}>{dash.riskPercent}%</ThemedText>
            </View>
          </View>

          <SectionTitle title="Recent Activity" />
          <View style={styles.activity}>
            <Ionicons name="home-outline" size={22} color={GuardianColors.safe} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.actTitle}>Geofence Exit</ThemedText>
              <ThemedText style={styles.actSub}>Resolved · 2h ago</ThemedText>
            </View>
            <ThemedText style={styles.secure}>SECURE</ThemedText>
          </View>
          <View style={styles.activity}>
            <Ionicons name="battery-dead-outline" size={22} color={GuardianColors.danger} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.actTitle}>Low Battery</ThemedText>
              <ThemedText style={styles.actSub}>Active · Mia&apos;s Tracker (15%)</ThemedText>
            </View>
            <ThemedText style={styles.attention}>ATTENTION</ThemedText>
          </View>

          <PrimaryButton variant="danger" label="EMERGENCY SOS" onPress={() => {}} />
        </ScrollView>

        <GuardianFab
          accessibilityLabel="Quick actions"
          onPress={() => router.push('/map' as any)}
          style={{ position: 'absolute', right: Layout.screenPadding, bottom: insets.bottom + 88 }}
        />
      </ThemedView>
    );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  profileBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: GuardianColors.safe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GuardianColors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GuardianColors.surface,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: GuardianColors.text,
    marginTop: 12,
  },
  profileMeta: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginTop: 4,
  },
  metaGreen: {
    color: GuardianColors.safe,
    fontWeight: '800',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  btnDark: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GuardianColors.text,
    height: 48,
    borderRadius: 24,
  },
  btnDarkText: {
    fontWeight: '800',
    fontSize: 15,
  },
  btnLight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GuardianColors.navyMuted,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  btnLightText: {
    fontWeight: '800',
    color: GuardianColors.primary,
    fontSize: 15,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 14,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GuardianColors.safeMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GuardianColors.safe,
  },
  liveText: {
    fontWeight: '800',
    color: GuardianColors.safe,
    fontSize: 12,
  },
  mapShot: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 10,
  },
  locRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addr: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  timeSmall: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  riskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 18,
  },
  riskLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  riskValue: {
    fontSize: 22,
    fontWeight: '900',
    color: GuardianColors.text,
    marginTop: 6,
  },
  ringScore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: GuardianColors.safeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScoreText: {
    fontWeight: '900',
    color: GuardianColors.safe,
    fontSize: 14,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 10,
  },
  actTitle: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  actSub: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    marginTop: 2,
  },
  secure: {
    fontWeight: '900',
    color: GuardianColors.safe,
    fontSize: 12,
  },
  attention: {
    fontWeight: '900',
    color: GuardianColors.danger,
    fontSize: 12,
  },
});

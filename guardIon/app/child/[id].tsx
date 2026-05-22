import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardianFab } from '@/components/guardian/fab';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ChildAvatar } from '@/components/guardian/child-avatar';
import { CheckInSheet } from '@/components/guardian/check-in-sheet';
import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ChildLiveLocationMap } from '@/components/guardian/child-live-location-map';
import { EmergencySosModal } from '@/components/guardian/emergency-sos-modal';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { StatusBadge } from '@/components/guardian/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getChildColorTheme } from '@/constants/child-colors';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { useCheckIn } from '@/hooks/use-check-in';
import { useSafeZones } from '@/hooks/use-safe-zones';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const childId = String(id ?? '1');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getChildById } = useGuardianData();
  const { deviceSafeCheck } = useAlertsRealtime();
  const child = getChildById(childId);
  const colors = getChildColorTheme(childId);
  const { childZones, refresh } = useSafeZones(childId);
  const { status: checkInStatus, lastLabel, start: startCheckIn, cancel: cancelCheckIn, canCheckIn } =
    useCheckIn(childId, child?.online ?? false);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openOnMap = () => {
    router.push({
      pathname: '/(tabs)/map',
      params: { childId },
    } as any);
  };

  const openAlerts = () => {
    router.push({
      pathname: '/(tabs)/alerts',
      params: { childId },
    } as any);
  };

  const openCheckIn = () => {
    cancelCheckIn();
    setCheckInOpen(true);
  };

  const closeCheckIn = () => {
    cancelCheckIn();
    setCheckInOpen(false);
  };

  useEffect(() => {
    if (!checkInOpen) return;
    if (deviceSafeCheck?.childId === childId) {
      closeCheckIn();
      return;
    }
    if (checkInStatus === 'confirmed') {
      const timer = setTimeout(() => closeCheckIn(), 1200);
      return () => clearTimeout(timer);
    }
  }, [deviceSafeCheck, checkInOpen, childId, checkInStatus, closeCheckIn]);

  const confirmCheckIn = () => {
    startCheckIn();
  };

  const openSos = () => {
    if (!child) return;
    Alert.alert(
      'Trigger emergency SOS?',
      `This will open the emergency panel for ${child.name}. Use only in a real emergency.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => setSosOpen(true) },
      ],
    );
  };

  if (!child) {
    return (
      <ThemedView style={styles.screen}>
        <ThemedText style={{ padding: 24 }}>Child not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 120,
        }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
          </Pressable>
        </View>

        <ScreenHeader subtitle={`${child.name}'s Dashboard`} onBellPress={openAlerts} />

        <View style={styles.profileBlock}>
          <View style={[styles.profileRing, { borderColor: colors.main }]}>
            <ChildAvatar
              childId={childId}
              size={84}
              borderRadius={42}
            />
            <View style={[styles.checkBadge, { backgroundColor: colors.main }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>
          <ThemedText style={styles.profileName}>{child.name}</ThemedText>
          <ThemedText style={styles.profileMeta}>
            Age {child.age} ·{' '}
            <ThemedText style={[styles.metaGreen, { color: colors.main }]}>
              {child.online ? 'Online' : 'Offline'}
            </ThemedText>
          </ThemedText>
          <StatusBadge variant={child.status} />
          <View style={styles.quickRow}>
            <Pressable style={styles.btnDark} onPress={openCheckIn}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.btnDarkText}>
                Check-in
              </ThemedText>
            </Pressable>
            <Pressable style={styles.btnLight} onPress={() => setContactsOpen(true)}>
              <Ionicons name="call-outline" size={20} color={GuardianColors.primary} />
              <ThemedText style={styles.btnLightText}>Call</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <ThemedText style={styles.cardTitle}>Live Location</ThemedText>
            <View style={[styles.livePill, { backgroundColor: colors.muted }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.main }]} />
              <ThemedText style={[styles.liveText, { color: colors.border }]}>
                {child.online ? 'Live Now' : 'Last known'}
              </ThemedText>
            </View>
          </View>

          <ChildLiveLocationMap
            child={child}
            zones={childZones}
            onPress={openOnMap}
            height={200}
          />

          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={18} color={colors.main} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.addr}>{child.location}</ThemedText>
              <ThemedText style={styles.timeSmall}>Last updated {child.lastUpdate}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.riskCard}>
          <View>
            <ThemedText style={styles.riskLabel}>SAFETY RISK LEVEL</ThemedText>
            <ThemedText style={styles.riskValue}>
              {child.status === 'safe' ? 'Low' : child.status === 'warning' ? 'Medium' : 'Unknown'}
            </ThemedText>
          </View>
          <View style={[styles.ringScore, { borderColor: colors.muted }]}>
            <ThemedText style={[styles.ringScoreText, { color: colors.main }]}>
              {child.status === 'safe' ? '12' : child.status === 'warning' ? '45' : '—'}%
            </ThemedText>
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
            <ThemedText style={styles.actSub}>Active · {child.deviceLabel}</ThemedText>
          </View>
          <ThemedText style={styles.attention}>ATTENTION</ThemedText>
        </View>

        <PrimaryButton variant="danger" label="EMERGENCY SOS" onPress={openSos} />
      </ScrollView>

      <CheckInSheet
        visible={checkInOpen}
        childName={child.name}
        status={checkInStatus}
        lastLabel={lastLabel}
        canCheckIn={canCheckIn}
        onClose={closeCheckIn}
        onConfirm={confirmCheckIn}
        onCall={() => {
          closeCheckIn();
          setContactsOpen(true);
        }}
        onViewMap={() => {
          closeCheckIn();
          openOnMap();
        }}
      />

      <ChildContactsSheet
        visible={contactsOpen}
        childId={childId}
        childName={child.name}
        onClose={() => setContactsOpen(false)}
      />

      <EmergencySosModal
        visible={sosOpen}
        child={child}
        zones={childZones}
        liveAddress={child.location}
        onClose={() => setSosOpen(false)}
        onAcknowledge={() => {}}
      />

      <GuardianFab
        accessibilityLabel="View on map"
        onPress={openOnMap}
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
    gap: 6,
  },
  profileRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GuardianColors.surface,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: GuardianColors.text,
    marginTop: 6,
  },
  profileMeta: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  metaGreen: {
    fontWeight: '800',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
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
    gap: 10,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontWeight: '800',
    fontSize: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScoreText: {
    fontWeight: '900',
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

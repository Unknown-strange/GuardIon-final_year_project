import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardianFab } from '@/components/guardian/fab';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timeZones, setTimeZones] = React.useState(false);

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/mockups/map-dashboard.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={[styles.darken, StyleSheet.absoluteFill]} />

      <View style={[styles.topSafe, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader />
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={GuardianColors.textMuted} />
          <TextInput
            placeholder="Search address or zone..."
            placeholderTextColor={GuardianColors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={[styles.controlsRight, { bottom: 280 }]}>
        <Pressable style={styles.roundBtn}>
          <Ionicons name="locate" size={20} color={GuardianColors.primary} />
        </Pressable>
        <Pressable style={styles.roundBtn}>
          <Ionicons name="layers-outline" size={20} color={GuardianColors.primary} />
        </Pressable>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.zoneRow}>
          <Pressable
            style={[styles.zoneBtn, styles.zoneSafe]}
            onPress={() => router.push('/add-safe-zone' as any)}>
            <Ionicons name="add-circle-outline" size={20} color={GuardianColors.safe} />
            <ThemedText style={styles.zoneSafeText}>Safe Zone</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.zoneBtn, styles.zoneRed]}
            onPress={() => router.push('/add-red-zone' as any)}>
            <Ionicons name="warning-outline" size={20} color={GuardianColors.danger} />
            <ThemedText style={styles.zoneRedText}>Red Zone</ThemedText>
          </Pressable>
        </View>

        <Pressable style={styles.manageRow}>
          <Ionicons name="create-outline" size={22} color={GuardianColors.textSecondary} />
          <ThemedText style={styles.manageText}>Manage All Zones</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={GuardianColors.textMuted} />
        </Pressable>

        <View style={styles.statusBlock}>
          <View>
            <ThemedText style={styles.statusLabel}>CURRENT STATUS</ThemedText>
            <View style={styles.statusLine}>
              <View style={styles.redDot} />
              <ThemedText style={styles.statusStrong}>OUTSIDE SAFE ZONE</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.updated}>Last updated 2 minutes ago</ThemedText>
        </View>

        <View style={styles.toggleRow}>
          <Ionicons name="time-outline" size={22} color={GuardianColors.text} />
          <View style={styles.toggleText}>
            <ThemedText style={styles.toggleTitle}>Time-Based Safe Zones</ThemedText>
            <ThemedText style={styles.toggleSub}>Auto-activate during school hours</ThemedText>
          </View>
          <Switch value={timeZones} onValueChange={setTimeZones} />
        </View>
      </View>

      <GuardianFab
        accessibilityLabel="Add zone"
        onPress={() => router.push('/add-safe-zone' as any)}
        style={{
          position: 'absolute',
          right: Layout.screenPadding,
          bottom: insets.bottom + 210,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GuardianColors.primaryDark,
  },
  darken: {
    backgroundColor: 'rgba(0,40,50,0.12)',
  },
  topSafe: {
    paddingHorizontal: Layout.screenPadding,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: GuardianColors.text,
    padding: 0,
  },
  controlsRight: {
    position: 'absolute',
    right: Layout.screenPadding,
    gap: 10,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GuardianColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  zoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  zoneSafe: {
    backgroundColor: GuardianColors.safeMuted,
  },
  zoneSafeText: {
    fontWeight: '800',
    color: GuardianColors.safe,
  },
  zoneRed: {
    backgroundColor: GuardianColors.dangerMuted,
  },
  zoneRedText: {
    fontWeight: '800',
    color: GuardianColors.danger,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GuardianColors.overlaySheet,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  manageText: {
    flex: 1,
    fontWeight: '700',
    color: GuardianColors.text,
    fontSize: 15,
  },
  statusBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GuardianColors.danger,
  },
  statusStrong: {
    fontWeight: '900',
    color: GuardianColors.danger,
    fontSize: 14,
  },
  updated: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    maxWidth: '44%',
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  toggleSub: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
});

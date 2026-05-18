import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

const MIN_R = 50;
const MAX_R = 1000;
const STEP = 50;

export default function AddSafeZoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState(350);

  const bump = (delta: number) => {
    setRadius((r) => Math.min(MAX_R, Math.max(MIN_R, r + delta)));
  };

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.titleRow}>
        <ThemedText style={styles.modalTitle}>Add Safe Zone</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={GuardianColors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Image
          source={require('@/assets/mockups/safe-zone-maps.png')}
          style={styles.map}
          contentFit="cover"
        />

        <ThemedText style={styles.label}>Zone Name</ThemedText>
        <TextInput
          value={zoneName}
          onChangeText={setZoneName}
          placeholder="e.g. Home, School, Park"
          placeholderTextColor={GuardianColors.textMuted}
          style={styles.input}
        />

        <ThemedText style={[styles.label, { marginTop: 14 }]}>Zone Type</ThemedText>
        <View style={styles.select}>
          <ThemedText style={styles.selectText}>Safe Zone (Arrival/Departure Alerts)</ThemedText>
          <Ionicons name="chevron-down" size={20} color={GuardianColors.textSecondary} />
        </View>

        <View style={styles.radiusHead}>
          <ThemedText style={styles.label}>Detection Radius</ThemedText>
          <View style={styles.pill}>
            <ThemedText style={styles.pillText}>{radius} meters</ThemedText>
          </View>
        </View>
        <View style={styles.sliderRow}>
          <ThemedText style={styles.edge}>50M</ThemedText>
          <Pressable style={styles.stepBtn} onPress={() => bump(-STEP)}>
            <Ionicons name="remove" size={22} color={GuardianColors.primary} />
          </Pressable>
          <View style={styles.track} />
          <Pressable style={styles.stepBtn} onPress={() => bump(STEP)}>
            <Ionicons name="add" size={22} color={GuardianColors.primary} />
          </Pressable>
          <ThemedText style={styles.edge}>1KM</ThemedText>
        </View>

        <View style={{ marginTop: 20, gap: 12 }}>
          <PrimaryButton label="Save Geofence" onPress={() => router.back()} />
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GuardianColors.text,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: GuardianColors.text,
  },
  radiusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  pill: {
    backgroundColor: GuardianColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  edge: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: GuardianColors.navyMuted,
  },
});

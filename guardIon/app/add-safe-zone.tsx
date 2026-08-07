import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ChildAvatar } from '@/components/guardian/child-avatar';
import { SafeZoneMapPicker } from '@/components/guardian/safe-zone-map-picker';
import { SafeZoneRadiusSlider } from '@/components/guardian/safe-zone-radius-slider';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getChildColorTheme } from '@/constants/child-colors';
import { useChildSummary } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { useSafeZones } from '@/hooks/use-safe-zones';
import {
  SAFE_ZONE_RADIUS_DEFAULT,
  SAFE_ZONE_RADIUS_MAX,
  SAFE_ZONE_RADIUS_MIN,
  type ZoneType,
} from '@/types/safe-zone';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function parseTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export default function AddSafeZoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId, zoneType: zoneTypeParam } = useLocalSearchParams<{
    childId?: string;
    zoneType?: string;
  }>();
  const resolvedChildId = String(childId ?? '');
  const { child } = useChildSummary(resolvedChildId);
  const { addZone } = useSafeZones(resolvedChildId || null);

  const [zoneType, setZoneType] = useState<ZoneType>(
    zoneTypeParam === 'danger' ? 'danger' : 'safe',
  );
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState(SAFE_ZONE_RADIUS_DEFAULT);
  const [mapFitToken, setMapFitToken] = useState(0);
  const [scheduled, setScheduled] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('15:00');
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  const showNativeMap = Platform.OS !== 'web';
  const canSave = zoneName.trim().length > 0 && !saving && !!child;

  const onSave = async () => {
    if (!canSave || !child) return;
    setSaving(true);
    try {
      await addZone({
        childId: child.id,
        name: zoneName.trim(),
        latitude: child.latitude,
        longitude: child.longitude,
        radiusM: Math.round(
          Math.min(SAFE_ZONE_RADIUS_MAX, Math.max(SAFE_ZONE_RADIUS_MIN, radius)),
        ),
        zoneType,
        schedule: scheduled ? { start: startTime, end: endTime } : null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (!child) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
        <ThemedText style={{ padding: 24 }}>Child not found.</ThemedText>
      </ThemedView>
    );
  }

  const colors = getChildColorTheme(child.id);

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.titleRow}>
        <ThemedText style={styles.modalTitle}>Add Zone</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={GuardianColors.text} />
        </Pressable>
      </View>

      <View style={styles.mapSection}>
        {showNativeMap ? (
          <SafeZoneMapPicker
            childId={child.id}
            childName={child.name}
            childLocation={child.location}
            childPosition={{ latitude: child.latitude, longitude: child.longitude }}
            radius={radius}
            zoneType={zoneType}
            fitToken={mapFitToken}
          />
        ) : (
          <Image
            source={
              zoneType === 'danger'
                ? require('@/assets/mockups/red-zone-maps.png')
                : require('@/assets/mockups/safe-zone-maps.png')
            }
            style={styles.webMap}
            contentFit="cover"
          />
        )}
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.childTag, { backgroundColor: colors.muted }]}>
          <ChildAvatar childId={child.id} size={28} borderWidth={2} borderColor={colors.main} />
          <ThemedText style={[styles.subtitle, { color: colors.border }]}>
            For {child.name}
          </ThemedText>
        </View>

        <ThemedText style={styles.label}>Zone Name</ThemedText>
        <TextInput
          value={zoneName}
          onChangeText={setZoneName}
          placeholder="e.g. Home, School, Park"
          placeholderTextColor={GuardianColors.textMuted}
          style={styles.input}
        />

        <ThemedText style={[styles.label, { marginTop: 14 }]}>Zone Type</ThemedText>
        <View style={styles.zoneTypeRow}>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.zoneTypeCard,
              zoneType === 'safe' && styles.zoneTypeCardSafeActive,
            ]}
            onPress={() => setZoneType('safe')}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={zoneType === 'safe' ? GuardianColors.safe : GuardianColors.textMuted}
            />
            <ThemedText
              style={[
                styles.zoneTypeTitle,
                zoneType === 'safe' && { color: GuardianColors.safe },
              ]}>
              Safe Zone
            </ThemedText>
            <ThemedText style={styles.zoneTypeSub}>Alerts when child leaves</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.zoneTypeCard,
              zoneType === 'danger' && styles.zoneTypeCardDangerActive,
            ]}
            onPress={() => setZoneType('danger')}>
            <Ionicons
              name="warning"
              size={18}
              color={zoneType === 'danger' ? GuardianColors.danger : GuardianColors.textMuted}
            />
            <ThemedText
              style={[
                styles.zoneTypeTitle,
                zoneType === 'danger' && { color: GuardianColors.danger },
              ]}>
              Danger Zone
            </ThemedText>
            <ThemedText style={styles.zoneTypeSub}>Alerts when child enters</ThemedText>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          <SafeZoneRadiusSlider
            value={radius}
            onChange={setRadius}
            onChangeComplete={() => setMapFitToken((token) => token + 1)}
          />
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleText}>
            <ThemedText style={styles.scheduleTitle}>Scheduled Zone</ThemedText>
            <ThemedText style={styles.scheduleSub}>Auto-activate during set hours</ThemedText>
          </View>
          <Switch value={scheduled} onValueChange={setScheduled} />
        </View>

        {scheduled ? (
          <View style={styles.timeRow}>
            <Pressable style={styles.timeBtn} onPress={() => setPickerMode('start')}>
              <ThemedText style={styles.timeLabel}>Start</ThemedText>
              <ThemedText style={styles.timeValue}>{startTime}</ThemedText>
            </Pressable>
            <Pressable style={styles.timeBtn} onPress={() => setPickerMode('end')}>
              <ThemedText style={styles.timeLabel}>End</ThemedText>
              <ThemedText style={styles.timeValue}>{endTime}</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {pickerMode && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={parseTime(pickerMode === 'start' ? startTime : endTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (Platform.OS === 'android') setPickerMode(null);
              if (!date) return;
              const formatted = formatTime(date);
              if (pickerMode === 'start') setStartTime(formatted);
              else setEndTime(formatted);
            }}
          />
        ) : null}

        {pickerMode && Platform.OS === 'ios' ? (
          <Pressable style={styles.donePicker} onPress={() => setPickerMode(null)}>
            <ThemedText style={styles.donePickerText}>Done</ThemedText>
          </Pressable>
        ) : null}

        <View style={{ marginTop: 20, gap: 12 }}>
          <PrimaryButton
            label={saving ? 'Saving...' : 'Save Geofence'}
            onPress={onSave}
            disabled={!canSave}
          />
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
  mapSection: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 12,
  },
  webMap: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  formScroll: {
    flex: 1,
  },
  childTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.caption,
    fontWeight: '700',
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
  zoneTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneTypeCard: {
    flex: 1,
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GuardianColors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 2,
    alignItems: 'center',
  },
  zoneTypeCardSafeActive: {
    borderColor: GuardianColors.safe,
    backgroundColor: GuardianColors.safeMuted,
  },
  zoneTypeCardDangerActive: {
    borderColor: GuardianColors.danger,
    backgroundColor: GuardianColors.dangerMuted,
  },
  zoneTypeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: GuardianColors.text,
    textAlign: 'center',
  },
  zoneTypeSub: {
    fontSize: 10,
    lineHeight: 13,
    color: GuardianColors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: GuardianColors.text,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingVertical: 8,
  },
  scheduleText: {
    flex: 1,
  },
  scheduleTitle: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  scheduleSub: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 12,
  },
  timeLabel: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  timeValue: {
    marginTop: 4,
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 16,
  },
  donePicker: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  donePickerText: {
    color: GuardianColors.primary,
    fontWeight: '800',
  },
});

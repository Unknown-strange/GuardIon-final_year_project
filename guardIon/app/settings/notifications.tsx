import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
        {hint ? <ThemedText style={styles.toggleHint}>{hint}</ThemedText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: GuardianColors.border, true: GuardianColors.navyMuted }}
        thumbColor={value ? GuardianColors.primary : GuardianColors.surface}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const [sos, setSos] = useState(true);
  const [geofence, setGeofence] = useState(true);
  const [battery, setBattery] = useState(false);
  const [weekly, setWeekly] = useState(true);

  return (
    <SettingsSubScreen
      title="Notifications"
      subtitle="Choose how GuardIon reaches you for alerts and summaries.">
      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>ALERTS</ThemedText>
        <ToggleRow
          label="SOS & emergency"
          hint="Immediate push when a child triggers SOS."
          value={sos}
          onValueChange={setSos}
        />
        <ToggleRow
          label="Geofence"
          hint="Enter / exit safe or restricted zones."
          value={geofence}
          onValueChange={setGeofence}
        />
        <ToggleRow
          label="Low battery"
          hint="When a tracker drops below 15%."
          value={battery}
          onValueChange={setBattery}
        />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>DIGEST</ThemedText>
        <ToggleRow
          label="Weekly summary"
          hint="Activity recap every Sunday evening."
          value={weekly}
          onValueChange={setWeekly}
        />
      </View>

      <View style={styles.quiet}>
        <ThemedText style={styles.quietTitle}>Quiet hours</ThemedText>
        <ThemedText style={styles.quietBody}>
          Scheduling quiet hours will arrive in a future update; for now, critical SOS alerts always
          break through.
        </ThemedText>
      </View>
    </SettingsSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
  toggleLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: GuardianColors.text,
  },
  toggleHint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 4,
  },
  quiet: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: GuardianColors.navyMuted,
  },
  quietTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: GuardianColors.primary,
    marginBottom: 6,
  },
  quietBody: {
    ...Typography.body,
    color: GuardianColors.primaryDark,
  },
});

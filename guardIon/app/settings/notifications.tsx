import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import * as preferencesApi from '@/api/preferences';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const prefs = await preferencesApi.getNotificationPreferences();
        setSos(prefs.sos_enabled);
        setGeofence(prefs.geofence_enabled);
        setBattery(prefs.battery_enabled);
        setWeekly(prefs.weekly_summary_enabled);
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(
    async (patch: Partial<preferencesApi.NotificationPreferences>) => {
      try {
        await preferencesApi.updateNotificationPreferences(patch);
      } catch {
        /* ignore save errors */
      }
    },
    [],
  );

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
          onValueChange={(v) => {
            setSos(v);
            void persist({ sos_enabled: v });
          }}
        />
        <ToggleRow
          label="Geofence"
          hint="Enter / exit safe or restricted zones."
          value={geofence}
          onValueChange={(v) => {
            setGeofence(v);
            void persist({ geofence_enabled: v });
          }}
        />
        <ToggleRow
          label="Low battery"
          hint="When a tracker drops below 15%."
          value={battery}
          onValueChange={(v) => {
            setBattery(v);
            void persist({ battery_enabled: v });
          }}
        />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>DIGEST</ThemedText>
        <ToggleRow
          label="Weekly summary"
          hint="Activity recap every Sunday evening."
          value={weekly}
          onValueChange={(v) => {
            setWeekly(v);
            void persist({ weekly_summary_enabled: v });
          }}
        />
      </View>

      {loading ? (
        <ThemedText style={styles.quietBody}>Loading preferences…</ThemedText>
      ) : null}

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

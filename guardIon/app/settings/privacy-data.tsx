import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

export default function PrivacyDataScreen() {
  const [shareSchool, setShareSchool] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <SettingsSubScreen
      title="Privacy & data"
      subtitle="Control what is stored and whether optional analytics help improve GuardIon.">
      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>SHARING</ThemedText>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <ThemedText style={styles.toggleLabel}>School-safe summaries</ThemedText>
            <ThemedText style={styles.toggleHint}>
              Share anonymized arrival patterns with verified partners (off by default).
            </ThemedText>
          </View>
          <Switch
            value={shareSchool}
            onValueChange={setShareSchool}
            trackColor={{ false: GuardianColors.border, true: GuardianColors.navyMuted }}
            thumbColor={shareSchool ? GuardianColors.primary : GuardianColors.surface}
          />
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>DATA</ThemedText>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <ThemedText style={styles.toggleLabel}>Product analytics</ThemedText>
            <ThemedText style={styles.toggleHint}>Crash and usage diagnostics.</ThemedText>
          </View>
          <Switch
            value={analytics}
            onValueChange={setAnalytics}
            trackColor={{ false: GuardianColors.border, true: GuardianColors.navyMuted }}
            thumbColor={analytics ? GuardianColors.primary : GuardianColors.surface}
          />
        </View>
        <View style={styles.bulletBlock}>
          <ThemedText style={styles.bullet}>• Location history retained up to 90 days.</ThemedText>
          <ThemedText style={styles.bullet}>• Export or delete your data from Account (coming soon).</ThemedText>
        </View>
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
  bulletBlock: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  bullet: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/guardian/buttons';
import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

const FAQ = [
  {
    q: 'How do safe zones work?',
    a: 'Draw zones on the Map tab; you’ll get alerts when a device enters or leaves.',
  },
  {
    q: 'Why is location delayed?',
    a: 'Battery saver and indoor GPS can slow fixes; SOS always prioritizes fresh coordinates.',
  },
  {
    q: 'How do I add another guardian?',
    a: 'Family invites will roll out soon — use Help below if you need early access.',
  },
];

export default function HelpSupportScreen() {
  return (
    <SettingsSubScreen
      title="Help & support"
      subtitle="Quick answers and ways to reach the GuardIon team.">
      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>POPULAR TOPICS</ThemedText>
        {FAQ.map((item, i) => (
          <View key={item.q} style={[styles.faqRow, i > 0 && styles.faqBorder]}>
            <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
            <ThemedText style={styles.faqA}>{item.a}</ThemedText>
          </View>
        ))}
      </View>

      <Pressable style={styles.linkRow}>
        <View style={styles.linkIcon}>
          <Ionicons name="document-text-outline" size={20} color={GuardianColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.linkTitle}>Safety guides</ThemedText>
          <ThemedText style={styles.linkHint}>PDF checklists for caregivers</ThemedText>
        </View>
        <Ionicons name="open-outline" size={18} color={GuardianColors.textMuted} />
      </Pressable>

      <PrimaryButton label="Contact support" onPress={() => {}} />

      <ThemedText style={styles.footer}>support@guardion.app · Typical reply within 24h</ThemedText>
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
    paddingBottom: 8,
  },
  faqRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  faqBorder: {
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
  faqQ: {
    fontWeight: '800',
    fontSize: 15,
    color: GuardianColors.text,
    marginBottom: 6,
  },
  faqA: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.surface,
    marginBottom: 16,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: GuardianColors.text,
  },
  linkHint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  footer: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});

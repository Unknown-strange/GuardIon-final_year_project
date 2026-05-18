import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SettingsSubScreen } from '@/components/guardian/settings-sub-screen';
import { ThemedText } from '@/components/themed-text';
import { MOCK_CHILDREN } from '@/constants/guardian-mocks';
import { GuardianColors, Typography } from '@/constants/theme';

export default function FamilyDevicesScreen() {
  const router = useRouter();

  return (
    <SettingsSubScreen
      title="Family & devices"
      subtitle="Children linked to your guardian account and their trackers.">
      <View style={styles.card}>
        <ThemedText style={styles.sectionLabel}>LINKED CHILDREN</ThemedText>
        {MOCK_CHILDREN.map((child) => (
          <Pressable
            key={child.id}
            accessibilityRole="button"
            style={styles.row}
            onPress={() =>
              router.push({ pathname: '/child/[id]', params: { id: child.id } })
            }>
            <View style={styles.rowIcon}>
              <Ionicons name="person-outline" size={20} color={GuardianColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.rowTitle}>{child.name}</ThemedText>
              <ThemedText style={styles.rowHint}>{child.deviceLabel}</ThemedText>
            </View>
            <View style={[styles.dot, child.online ? styles.dotOn : styles.dotOff]} />
            <Ionicons name="chevron-forward" size={18} color={GuardianColors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.addBtn}>
        <Ionicons name="add-circle-outline" size={22} color={GuardianColors.primary} />
        <ThemedText style={styles.addText}>Invite family member</ThemedText>
      </Pressable>
    </SettingsSubScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: GuardianColors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: GuardianColors.text,
  },
  rowHint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  dotOn: {
    backgroundColor: GuardianColors.safe,
  },
  dotOff: {
    backgroundColor: GuardianColors.offline,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    borderStyle: 'dashed',
    backgroundColor: GuardianColors.surface,
  },
  addText: {
    ...Typography.bodySemi,
    color: GuardianColors.primary,
  },
});

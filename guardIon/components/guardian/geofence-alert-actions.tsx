import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';

type Props = {
  childName: string;
  onCheckIn: () => void;
  onEmergencySos: () => void;
  onMarkSafe: () => void;
  markingSafe?: boolean;
};

export function GeofenceAlertActions({
  childName,
  onCheckIn,
  onEmergencySos,
  onMarkSafe,
  markingSafe = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable style={styles.checkInBtn} onPress={onCheckIn}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={GuardianColors.primary} />
          <ThemedText style={styles.checkInText}>Check in</ThemedText>
        </Pressable>
        <Pressable style={styles.sosBtn} onPress={onEmergencySos}>
          <Ionicons name="warning" size={16} color="#FFFFFF" />
          <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.sosText}>
            Emergency SOS
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        style={styles.safeRow}
        onPress={onMarkSafe}
        disabled={markingSafe}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}>
        {markingSafe ? (
          <ActivityIndicator size="small" color={GuardianColors.safe} />
        ) : (
          <View style={styles.checkbox}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.checkHidden} />
          </View>
        )}
        <ThemedText style={styles.safeText}>
          {childName} is safe — stop this alert
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  checkInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GuardianColors.navyMuted,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  checkInText: {
    fontWeight: '800',
    color: GuardianColors.primary,
    fontSize: 14,
  },
  sosBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GuardianColors.danger,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sosText: {
    fontWeight: '800',
    fontSize: 14,
  },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GuardianColors.safe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHidden: {
    opacity: 0,
  },
  safeText: {
    ...Typography.body,
    flex: 1,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
});

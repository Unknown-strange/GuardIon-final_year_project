import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import type { CheckInStatus } from '@/hooks/use-check-in';

type Props = {
  visible: boolean;
  childName: string;
  status: CheckInStatus;
  lastLabel: string | null;
  canCheckIn: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCall: () => void;
  onViewMap: () => void;
};

export function CheckInSheet({
  visible,
  childName,
  status,
  lastLabel,
  canCheckIn,
  onClose,
  onConfirm,
  onCall,
  onViewMap,
}: Props) {
  const insets = useSafeAreaInsets();

  const renderBody = () => {
    if (status === 'pending') {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={GuardianColors.primary} />
          <ThemedText style={styles.pendingTitle}>Waiting for response…</ThemedText>
          <ThemedText style={styles.pendingSub}>
            Asking {childName} to confirm they&apos;re safe.
          </ThemedText>
        </View>
      );
    }

    if (status === 'confirmed') {
      return (
        <View style={styles.centerBlock}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={GuardianColors.safe} />
          </View>
          <ThemedText style={styles.successTitle}>{childName} is safe</ThemedText>
          <ThemedText style={styles.pendingSub}>Check-in confirmed {lastLabel ?? 'just now'}.</ThemedText>
          <View style={styles.actions}>
            <PrimaryButton label="Done" onPress={onClose} />
          </View>
        </View>
      );
    }

    if (status === 'timeout') {
      return (
        <View style={styles.centerBlock}>
          <View style={styles.warnIcon}>
            <Ionicons name="alert-circle" size={48} color={GuardianColors.warning} />
          </View>
          <ThemedText style={styles.successTitle}>No response yet</ThemedText>
          <ThemedText style={styles.pendingSub}>
            {childName} hasn&apos;t confirmed. Try calling or view their location.
          </ThemedText>
          <View style={styles.actions}>
            <PrimaryButton label="Call" onPress={onCall} />
            <SecondaryButton label="View on map" onPress={onViewMap} />
            <SecondaryButton label="Close" onPress={onClose} />
          </View>
        </View>
      );
    }

    return (
      <>
        <ThemedText style={styles.confirmText}>
          Send a check-in request to {childName}? They&apos;ll be asked to confirm they&apos;re safe.
        </ThemedText>
        {lastLabel ? (
          <ThemedText style={styles.lastCheck}>Last confirmed: {lastLabel}</ThemedText>
        ) : null}
        {!canCheckIn ? (
          <ThemedText style={styles.offlineNote}>
            Device is offline — check-in is unavailable until they reconnect.
          </ThemedText>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton label="Send check-in" onPress={onConfirm} disabled={!canCheckIn} />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={status === 'pending' ? undefined : onClose}>
        <Pressable
          style={[styles.card, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText style={styles.title}>Check-in</ThemedText>
            {status !== 'pending' ? (
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={GuardianColors.text} />
              </Pressable>
            ) : null}
          </View>
          {renderBody()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderTopLeftRadius: Layout.cardRadius + 4,
    borderTopRightRadius: Layout.cardRadius + 4,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GuardianColors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  confirmText: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  lastCheck: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginBottom: 12,
  },
  offlineNote: {
    ...Typography.caption,
    color: GuardianColors.warning,
    fontWeight: '700',
    marginBottom: 12,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GuardianColors.text,
    marginTop: 12,
  },
  pendingSub: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successIcon: {
    marginBottom: 4,
  },
  warnIcon: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GuardianColors.text,
  },
});

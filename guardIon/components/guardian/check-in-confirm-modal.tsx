import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type Props = {
  visible: boolean;
  childName: string;
  canCheckIn: boolean;
  lastLabel: string | null;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
};

export function CheckInConfirmModal({
  visible,
  childName,
  canCheckIn,
  lastLabel,
  onClose,
  onConfirm,
  submitting = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { marginBottom: insets.bottom + 24 }]}
          onPress={(e) => e.stopPropagation()}>
          <ThemedText style={styles.title}>Check-in</ThemedText>
          <ThemedText style={styles.body}>
            Send a check-in request to {childName}? They&apos;ll be asked to confirm they&apos;re
            safe on their device.
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
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Send check-in'}
              onPress={onConfirm}
              disabled={!canCheckIn || submitting}
            />
            <SecondaryButton label="Cancel" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    padding: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  body: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    lineHeight: 22,
  },
  lastCheck: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
  offlineNote: {
    ...Typography.caption,
    color: GuardianColors.warning,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});

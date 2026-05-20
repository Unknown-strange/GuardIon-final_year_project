import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ChildLiveLocationMap } from '@/components/guardian/child-live-location-map';
import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import type { SafeZone } from '@/types/safe-zone';

type Props = {
  visible: boolean;
  child: ChildSummary;
  zones?: SafeZone[];
  liveAddress?: string;
  onClose: () => void;
  onAcknowledge: () => void;
};

export function EmergencySosModal({
  visible,
  child,
  zones = [],
  liveAddress,
  onClose,
  onAcknowledge,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = getChildColorTheme(child.id);
  const [contactsOpen, setContactsOpen] = useState(false);

  const handleAcknowledge = () => {
    Alert.alert('Acknowledge SOS?', 'Mark this emergency as acknowledged?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Acknowledge',
        onPress: () => {
          onAcknowledge();
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.banner}>
              <Ionicons name="warning" size={22} color="#FFFFFF" />
              <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.bannerText}>
                EMERGENCY SOS — {child.name}
              </ThemedText>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.mapWrap}>
              <ChildLiveLocationMap child={child} zones={zones} height={220} />
              <View style={[styles.liveChip, { backgroundColor: colors.muted }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.main }]} />
                <ThemedText style={[styles.liveText, { color: colors.border }]}>Live location</ThemedText>
              </View>
            </View>

            {liveAddress ? (
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={18} color={GuardianColors.danger} />
                <ThemedText style={styles.addr}>{liveAddress}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={styles.hint}>
              SOS was triggered from {child.name}&apos;s device. Call emergency contacts or acknowledge once
              resolved.
            </ThemedText>

            <View style={styles.actions}>
              <PrimaryButton
                variant="danger"
                label="Call emergency contacts"
                onPress={() => setContactsOpen(true)}
              />
              <SecondaryButton label="Acknowledge" onPress={handleAcknowledge} />
            </View>
          </View>
        </View>
      </Modal>

      <ChildContactsSheet
        visible={contactsOpen}
        childId={child.id}
        childName={child.name}
        filterTypes={['guardian', 'school', 'emergency']}
        onClose={() => setContactsOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(127, 29, 29, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius + 4,
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GuardianColors.danger,
    marginHorizontal: -16,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerText: {
    flex: 1,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  mapWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  liveChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontWeight: '800',
    fontSize: 12,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addr: {
    flex: 1,
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 15,
  },
  hint: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
});

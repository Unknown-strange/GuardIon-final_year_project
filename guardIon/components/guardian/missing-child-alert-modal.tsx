import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as alertsApi from '@/api/alerts';
import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ChildLiveLocationMap } from '@/components/guardian/child-live-location-map';
import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import type { SafeZone } from '@/types/safe-zone';
import type { AlertWsPayload } from '@/hooks/use-alerts-websocket';

type Props = {
  visible: boolean;
  child: ChildSummary;
  alert: AlertWsPayload;
  zones?: SafeZone[];
  liveAddress?: string;
  onClose: () => void;
  onResolved?: () => void;
};

export function MissingChildAlertModal({
  visible,
  child,
  alert,
  zones = [],
  liveAddress,
  onClose,
  onResolved,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = getChildColorTheme(child.id);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  const mapChild: ChildSummary =
    alert.location_lat != null && alert.location_lng != null
      ? {
          ...child,
          latitude: alert.location_lat,
          longitude: alert.location_lng,
        }
      : child;

  const photoUrl = alert.image_url ?? child.profilePhoto;

  const handleMarkFound = () => {
    Alert.alert('Child is found?', `Mark ${child.name} as found and safe? All guardians will be notified.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Child is found',
        onPress: () => {
          setResolving(true);
          void alertsApi
            .resolveAlert(alert.alert_id, 'Guardian confirmed child is found and safe')
            .then(() => {
              onResolved?.();
              onClose();
            })
            .finally(() => setResolving(false));
        },
      },
    ]);
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.card,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
            ]}>
            <View style={styles.banner}>
              <Ionicons name="alert-circle" size={22} color="#FFFFFF" />
              <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.bannerText}>
                MISSING CHILD — {child.name}
              </ThemedText>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel={`Photo of ${child.name}`}
              />
            ) : null}

            {alert.reporter_name ? (
              <ThemedText style={styles.reporter}>
                Reported by {alert.reporter_name}
              </ThemedText>
            ) : null}

            {alert.notes ? (
              <ThemedText style={styles.notes}>{alert.notes}</ThemedText>
            ) : null}

            <View style={styles.mapWrap}>
              <ChildLiveLocationMap child={mapChild} zones={zones} height={200} />
              <View style={[styles.liveChip, { backgroundColor: colors.muted }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.main }]} />
                <ThemedText style={[styles.liveText, { color: colors.border }]}>
                  Last known location
                </ThemedText>
              </View>
            </View>

            {liveAddress ? (
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={18} color={GuardianColors.danger} />
                <ThemedText style={styles.addr}>{liveAddress}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={styles.hint}>
              Share this alert with other guardians. Call emergency contacts if you cannot reach{' '}
              {child.name}.
            </ThemedText>

            <View style={styles.actions}>
              <PrimaryButton
                variant="danger"
                label="Call emergency contacts"
                onPress={() => setContactsOpen(true)}
              />
              <PrimaryButton
                label={resolving ? 'Marking found…' : 'Child is found'}
                onPress={handleMarkFound}
                disabled={resolving}
              />
              <SecondaryButton label="Dismiss" onPress={onClose} />
            </View>
          </View>
        </View>
      </Modal>

      <ChildContactsSheet
        visible={contactsOpen}
        childId={child.id}
        childName={child.name}
        onClose={() => setContactsOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(127, 29, 29, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius + 4,
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 12,
    maxHeight: '92%',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GuardianColors.danger,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerText: {
    flex: 1,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: GuardianColors.border,
  },
  reporter: {
    ...Typography.body,
    fontWeight: '700',
    color: GuardianColors.text,
  },
  notes: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  mapWrap: {
    borderRadius: 12,
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
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addr: {
    flex: 1,
    ...Typography.body,
    color: GuardianColors.text,
  },
  hint: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});

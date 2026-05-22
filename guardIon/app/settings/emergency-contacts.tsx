import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmergencyContactCard } from '@/components/guardian/emergency-contact-card';
import {
  EmergencyContactModal,
  type EmergencyContactPayload,
} from '@/components/guardian/emergency-contact-modal';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_EMERGENCY_CONTACTS,
  type EmergencyContact,
} from '@/constants/emergency-contacts-mocks';
import { useGuardianData } from '@/contexts/guardian-data-context';
import * as emergencyContactsApi from '@/api/emergency-contacts';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { callPhone } from '@/utils/phone';

const AVATAR_COLORS = ['#072B59', '#0D9488', '#2563EB', '#7C3AED', '#DB2777', '#EA580C'];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { children } = useGuardianData();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emergencyContactsApi.listEmergencyContacts();
      setContacts(
        res.contacts.map((c, index) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relationship: c.relationship ?? '',
          avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        })),
      );
    } catch {
      setContacts(MOCK_EMERGENCY_CONTACTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const openAlerts = () => {
    router.push('/(tabs)/alerts' as any);
  };

  const handleCall = (contact: EmergencyContact) => {
    void callPhone(contact.phone, contact.name);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingContact(null);
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Remove emergency contact?',
      `${contact.name} will no longer be notified during SOS alerts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await emergencyContactsApi.deleteEmergencyContact(contact.id);
              setContacts((prev) => prev.filter((c) => c.id !== contact.id));
              showToast('Emergency contact removed');
            })();
          },
        },
      ],
    );
  };

  const handleSave = (payload: EmergencyContactPayload) => {
    void (async () => {
      if (modalMode === 'edit' && editingContact) {
        const updated = await emergencyContactsApi.updateEmergencyContact(editingContact.id, {
          name: payload.name,
          phone: payload.phone,
          relationship: payload.relationship,
        });
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingContact.id
              ? {
                  ...c,
                  name: updated.name,
                  relationship: updated.relationship ?? '',
                  phone: updated.phone,
                }
              : c,
          ),
        );
        showToast('Emergency contact updated');
        closeModal();
        return;
      }

      const childId = children[0]?.id;
      if (!childId) return;

      const created = await emergencyContactsApi.createEmergencyContact({
        child_id: childId,
        name: payload.name,
        phone: payload.phone,
        relationship: payload.relationship,
      });
      setContacts((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          phone: created.phone,
          relationship: created.relationship ?? '',
          avatarColor: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
        },
      ]);
      showToast('Emergency contact added');
      closeModal();
    })();
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Emergency Contacts</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={openAlerts}
            style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={GuardianColors.text} />
          </Pressable>
        </View>

        <View style={styles.headerRule} />

        <ThemedText style={styles.lead}>
          These contacts will be notified immediately if your child triggers an SOS alert.
        </ThemedText>

        <View style={styles.list}>
          {contacts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="call-outline" size={28} color={GuardianColors.textMuted} />
              <ThemedText style={styles.emptyTitle}>No emergency contacts yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                Add trusted people who should be reached first during an SOS.
              </ThemedText>
            </View>
          ) : (
            contacts.map((contact, index) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 60).duration(280)}>
                <EmergencyContactCard
                  contact={contact}
                  onCall={() => handleCall(contact)}
                  onEdit={() => {
                    setEditingContact(contact);
                    setModalMode('edit');
                  }}
                  onDelete={() => handleDelete(contact)}
                />
              </Animated.View>
            ))
          )}
        </View>

        <View style={styles.addRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModalMode('add')}
            style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.addText}>
              Add Emergency Contact
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <EmergencyContactModal
        visible={modalMode !== null}
        mode={modalMode === 'edit' ? 'edit' : 'add'}
        contact={editingContact}
        onClose={closeModal}
        onSave={handleSave}
      />

      <GuardianToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 20,
    color: GuardianColors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRule: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginBottom: 18,
    opacity: 0.8,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: GuardianColors.textSecondary,
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    backgroundColor: GuardianColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
    marginTop: 4,
  },
  emptyText: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addRow: {
    marginTop: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GuardianColors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addText: {
    fontSize: 16,
    fontWeight: '900',
  },
});

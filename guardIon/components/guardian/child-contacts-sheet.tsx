import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactRow } from '@/components/guardian/contact-row';
import { ThemedText } from '@/components/themed-text';
import { getContactsForChild } from '@/constants/child-contacts-mocks';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import type { ChildContact } from '@/types/child-contact';
import { callPhone } from '@/utils/phone';

type Props = {
  visible: boolean;
  childId: string;
  childName: string;
  onClose: () => void;
  /** When set, only show these contacts (e.g. emergency-only for SOS modal). */
  filterTypes?: ChildContact['type'][];
};

export function ChildContactsSheet({
  visible,
  childId,
  childName,
  onClose,
  filterTypes,
}: Props) {
  const insets = useSafeAreaInsets();
  const contacts = getContactsForChild(childId).filter(
    (c) => !filterTypes?.length || filterTypes.includes(c.type),
  );

  const handleCall = (contact: ChildContact) => {
    const dial = () => {
      void callPhone(contact.phone, contact.name);
      onClose();
    };

    if (contact.type === 'emergency') {
      Alert.alert(
        'Call emergency services?',
        `Place a call to ${contact.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', style: 'destructive', onPress: dial },
        ],
      );
      return;
    }

    dial();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.title}>Call {childName}</ThemedText>
              <ThemedText style={styles.sub}>Choose a contact to dial</ThemedText>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={GuardianColors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.rowWrap}>
                <ContactRow contact={contact} onPress={() => handleCall(contact)} />
              </View>
            ))}
            {contacts.length === 0 ? (
              <ThemedText style={styles.empty}>No contacts available.</ThemedText>
            ) : null}
          </ScrollView>
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
    maxHeight: '70%',
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
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  sub: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginTop: 4,
  },
  list: {
    flexGrow: 0,
  },
  rowWrap: {
    marginBottom: 10,
  },
  empty: {
    ...Typography.body,
    color: GuardianColors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});

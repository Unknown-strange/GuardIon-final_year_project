import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddGuardianModal,
  payloadToGuardianMember,
  type AddGuardianPayload,
} from '@/components/guardian/add-guardian-modal';
import { GuardianMemberCard } from '@/components/guardian/guardian-member-card';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_GUARDIANS, type GuardianMember } from '@/constants/guardian-profile-mocks';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

export default function GuardiansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [guardians, setGuardians] = useState<GuardianMember[]>(MOCK_GUARDIANS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? guardians
      : guardians.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.email.toLowerCase().includes(q) ||
            g.role.toLowerCase().includes(q) ||
            (g.status === 'pending' && 'invite pending'.includes(q)),
        );

    return [...list].sort((a, b) => {
      const aPending = a.status === 'pending' ? 0 : 1;
      const bPending = b.status === 'pending' ? 0 : 1;
      return aPending - bPending;
    });
  }, [guardians, query]);

  const handleInvite = (payload: AddGuardianPayload) => {
    const member = payloadToGuardianMember(payload, String(Date.now()));
    setGuardians((prev) => [...prev, member]);
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
          <ThemedText style={styles.headerTitle}>Guardians</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searchOpen ? 'Close search' : 'Search guardians'}
            onPress={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery('');
            }}
            style={styles.headerBtn}>
            <Ionicons
              name={searchOpen ? 'close' : 'search-outline'}
              size={22}
              color={GuardianColors.text}
            />
          </Pressable>
        </View>

        <View style={styles.headerRule} />

        <ThemedText style={styles.lead}>
          Manage who can track and receive alerts for your children.
        </ThemedText>

        {searchOpen ? (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={GuardianColors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or email"
              placeholderTextColor={GuardianColors.textMuted}
              style={styles.searchInput}
              autoFocus
            />
          </Animated.View>
        ) : null}

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={28} color={GuardianColors.textMuted} />
              <ThemedText style={styles.emptyText}>No guardians match your search.</ThemedText>
            </View>
          ) : (
            filtered.map((guardian, index) => (
              <Animated.View
                key={guardian.id}
                entering={FadeInDown.delay(index * 60).duration(280)}>
                <GuardianMemberCard guardian={guardian} />
              </Animated.View>
            ))
          )}
        </View>

        <View style={styles.addRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAddOpen(true)}
            style={styles.addBtn}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.addText}>
              Add Guardian
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <AddGuardianModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onInvite={handleInvite}
        onInvited={() => setToastVisible(true)}
      />

      <GuardianToast
        visible={toastVisible}
        message="Guardion invite sent"
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    color: GuardianColors.primary,
    marginBottom: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: GuardianColors.text,
    padding: 0,
  },
  list: {
    gap: 12,
    marginBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  emptyText: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GuardianColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  addText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

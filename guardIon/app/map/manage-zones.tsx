import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { SafeZoneCard } from '@/components/guardian/safe-zone-card';
import { SafeZoneListSkeleton } from '@/components/guardian/safe-zone-card-skeleton';
import { SafeZoneRadiusSlider } from '@/components/guardian/safe-zone-radius-slider';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useChildSummary } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { useSafeZones } from '@/hooks/use-safe-zones';
import type { SafeZone } from '@/types/safe-zone';
import {
  SAFE_ZONE_RADIUS_DEFAULT,
  SAFE_ZONE_RADIUS_MAX,
  SAFE_ZONE_RADIUS_MIN,
} from '@/types/safe-zone';

type ZoneTab = 'safe' | 'red' | 'time';

export default function ManageZonesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const resolvedChildId = String(childId ?? '');
  const { child } = useChildSummary(resolvedChildId);
  const { childZones, loading, refresh, updateZone, deleteZone } = useSafeZones(resolvedChildId || null);

  const [activeTab, setActiveTab] = useState<ZoneTab>('safe');
  const [editingZone, setEditingZone] = useState<SafeZone | null>(null);
  const [editName, setEditName] = useState('');
  const [editRadius, setEditRadius] = useState(SAFE_ZONE_RADIUS_DEFAULT);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openEdit = (zone: SafeZone) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditRadius(zone.radiusM);
  };

  const closeEdit = () => setEditingZone(null);

  const confirmDelete = (zone: SafeZone) => {
    Alert.alert('Delete zone', `Remove "${zone.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteZone(zone.id) },
    ]);
  };

  const saveEdit = async () => {
    if (!editingZone || !editName.trim()) return;
    setSaving(true);
    try {
      await updateZone(editingZone.id, {
        name: editName.trim(),
        radiusM: Math.round(
          Math.min(SAFE_ZONE_RADIUS_MAX, Math.max(SAFE_ZONE_RADIUS_MIN, editRadius)),
        ),
      });
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    if (!child) return;
    router.push({
      pathname: '/add-safe-zone',
      params: { childId: child.id },
    } as any);
  };

  if (!child) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <ThemedText style={{ padding: 24 }}>Child not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerPad}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />
        </Pressable>
        <ScreenHeader subtitle={`Zones for ${child.name}`} />
        <ThemedText style={styles.pageTitle}>Manage zones</ThemedText>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, activeTab === 'safe' && styles.tabActive]} onPress={() => setActiveTab('safe')}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'safe' ? GuardianColors.safe : GuardianColors.textMuted}
          />
          <ThemedText style={[styles.tabText, activeTab === 'safe' && styles.tabTextActive]}>
            Safe zones
          </ThemedText>
        </Pressable>
        <Pressable style={styles.tabDisabled} disabled>
          <Ionicons name="warning-outline" size={16} color={GuardianColors.textMuted} />
          <ThemedText style={styles.tabTextDisabled}>Red zones</ThemedText>
        </Pressable>
        <Pressable style={styles.tabDisabled} disabled>
          <Ionicons name="time-outline" size={16} color={GuardianColors.textMuted} />
          <ThemedText style={styles.tabTextDisabled}>Time based zones</ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <SafeZoneListSkeleton count={2} />
      ) : (
        <FlatList
          data={childZones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: Layout.screenPadding,
            paddingBottom: insets.bottom + 100,
            gap: 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={42} color={GuardianColors.textMuted} />
              <ThemedText style={styles.emptyTitle}>No safe zones yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                Add a zone around {child.name}&apos;s location.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <SafeZoneCard zone={item} onEdit={() => openEdit(item)} onDelete={() => confirmDelete(item)} />
          )}
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 20, backgroundColor: GuardianColors.primary }]}
        onPress={addZone}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <ThemedText style={styles.fabText}>Add New Zone</ThemedText>
      </Pressable>

      <Modal visible={!!editingZone} animationType="slide" transparent onRequestClose={closeEdit}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Zone</ThemedText>
              <Pressable onPress={closeEdit}>
                <Ionicons name="close" size={24} color={GuardianColors.text} />
              </Pressable>
            </View>

            <ThemedText style={styles.label}>Zone Name</ThemedText>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholderTextColor={GuardianColors.textMuted}
            />

            <View style={{ marginTop: 16 }}>
              <SafeZoneRadiusSlider value={editRadius} onChange={setEditRadius} />
            </View>

            <View style={styles.modalActions}>
              <PrimaryButton
                label={saving ? 'Saving...' : 'Save Changes'}
                onPress={saveEdit}
                disabled={!editName.trim() || saving}
              />
              <SecondaryButton label="Cancel" onPress={closeEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.atmosphereBlue,
  },
  headerPad: {
    paddingHorizontal: Layout.screenPadding,
    gap: 4,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: GuardianColors.primaryDark,
    marginTop: 4,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    gap: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GuardianColors.border,
    paddingBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: GuardianColors.safe,
  },
  tabText: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  tabTextActive: {
    color: GuardianColors.safe,
  },
  tabDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.45,
    paddingBottom: 8,
  },
  tabTextDisabled: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  emptyText: {
    ...Typography.body,
    color: GuardianColors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: GuardianColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: GuardianColors.overlaySheet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: GuardianColors.text,
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
});

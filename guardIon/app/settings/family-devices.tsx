import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import React, { useEffect, useMemo, useState } from 'react';

import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import {
  AddChildModal,
  type RegisterChildPayload,
} from '@/components/guardian/add-child-modal';
import { ChildManagedCard } from '@/components/guardian/child-managed-card';
import { ListCardSkeletonList } from '@/components/guardian/skeleton';
import { EditChildModal, type EditChildPayload } from '@/components/guardian/edit-child-modal';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getErrorMessage } from '@/api/errors';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import {
  loadChildCustomAvatars,
  removeChildCustomAvatar,
  setChildCustomAvatar,
} from '@/utils/child-custom-avatars';
import { calculateAgeFromBirthDate } from '@/utils/child-age';



export default function FamilyDevicesScreen() {

  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string }>();

  const insets = useSafeAreaInsets();

  const {
    children,
    isLoading,
    registerChild: registerChildApi,
    updateChildProfile,
    removeChild: removeChildApi,
  } = useGuardianData();

  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});

  const [editingChild, setEditingChild] = useState<ChildSummary | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);

  const [toastMessage, setToastMessage] = useState('');



  useEffect(() => {

    void loadChildCustomAvatars().then(setCustomAvatars);

  }, []);

  useEffect(() => {
    if (params.add === '1') {
      setAddOpen(true);
    }
  }, [params.add]);

  const closeAddModal = () => {
    setAddOpen(false);
    if (params.add) {
      router.replace('/settings/family-devices' as any);
    }
  };



  const activeCount = useMemo(
    () => children.filter((c) => c.connectionStatus === 'online').length,
    [children],
  );

  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);



  const showToast = (message: string) => {

    setToastMessage(message);

    setToastVisible(true);

  };



  const openAlerts = () => {

    router.push('/(tabs)/alerts' as any);

  };



  const persistAvatar = async (childId: string, uri: string | null | undefined) => {

    if (!uri) return customAvatars;

    const next = await setChildCustomAvatar(childId, uri);

    setCustomAvatars(next);

    return next;

  };



  const registerChild = async (payload: RegisterChildPayload) => {
    try {
      await registerChildApi(payload);
      showToast('Child registered successfully');
    } catch (error) {
      Alert.alert('Registration failed', getErrorMessage(error));
    }
  };



  const removeChild = async (id: string) => {
    setDeletingChildId(id);
    try {
      const deletePromise = removeChildApi(id);
      showToast('Child removed');
      await deletePromise;
      const next = await removeChildCustomAvatar(id);
      setCustomAvatars(next);
    } catch (error) {
      Alert.alert('Remove failed', getErrorMessage(error));
    } finally {
      setDeletingChildId(null);
    }
  };



  const saveChild = async (childId: string, payload: EditChildPayload) => {
    try {
      const name = `${payload.firstName} ${payload.lastName}`.trim();
      const age = calculateAgeFromBirthDate(payload.dateOfBirth);
      await updateChildProfile(childId, {
        name,
        age,
        profile_photo: payload.avatarUri ?? null,
      });
      showToast('Child profile updated');
    } catch (error) {
      Alert.alert('Update failed', getErrorMessage(error));
    }
  };



  return (

    <ThemedView style={styles.screen}>

      <ScrollView

        contentContainerStyle={{

          paddingHorizontal: Layout.screenPadding,

          paddingTop: insets.top + 8,

          paddingBottom: insets.bottom + 100,

        }}

        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>

          <Pressable

            accessibilityRole="button"

            accessibilityLabel="Go back"

            onPress={() => router.back()}

            style={styles.headerBtn}>

            <Ionicons name="chevron-back" size={22} color={GuardianColors.primary} />

          </Pressable>

          <ThemedText style={styles.headerTitle}>Children</ThemedText>

          <Pressable

            accessibilityRole="button"

            accessibilityLabel="Notifications"

            onPress={openAlerts}

            style={styles.headerBtn}>

            <Ionicons name="notifications-outline" size={22} color={GuardianColors.text} />

          </Pressable>

        </View>



        <View style={styles.headerRule} />



        <ThemedText style={styles.sectionTitle}>Managed Devices</ThemedText>

        <ThemedText style={styles.sectionSub}>

          Monitoring {activeCount} active profile{activeCount === 1 ? '' : 's'}

        </ThemedText>



        <View style={styles.list}>

          {isLoading && children.length === 0 ? (
            <ListCardSkeletonList variant="child-managed" count={2} />
          ) : (
          children.map((child, index) => (

            <Animated.View key={child.id} entering={FadeInDown.delay(index * 60).duration(280)}>

              <ChildManagedCard

                child={child}

                age={child.age}

                imageUri={customAvatars[child.id]}

                isDeleting={deletingChildId === child.id}

                onPress={() =>

                  router.push({ pathname: '/child/[id]', params: { id: child.id } })

                }

                onEdit={() => setEditingChild(child)}

                onDelete={() => {

                  Alert.alert(

                    'Remove child profile?',

                    `Remove ${child.name} from your managed devices?`,

                    [

                      { text: 'Cancel', style: 'cancel' },

                      {

                        text: 'Remove',

                        style: 'destructive',

                        onPress: () => void removeChild(child.id),

                      },

                    ],

                  );

                }}

              />

            </Animated.View>

          ))
          )}

        </View>

      </ScrollView>



      <Pressable

        accessibilityRole="button"

        onPress={() => setAddOpen(true)}

        style={[styles.fab, { bottom: insets.bottom + 88 }, deletingChildId ? styles.fabDisabled : null]}

        disabled={!!deletingChildId}>

        <Ionicons name="add" size={20} color="#FFFFFF" />

        <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.fabText}>

          Add Child

        </ThemedText>

      </Pressable>



      <AddChildModal

        visible={addOpen}

        onClose={closeAddModal}

        onRegister={(payload) => void registerChild(payload)}

      />



      <EditChildModal

        visible={!!editingChild}

        child={editingChild}

        avatarUri={editingChild ? customAvatars[editingChild.id] : null}

        onClose={() => setEditingChild(null)}

        onSave={(childId, payload) => void saveChild(childId, payload)}

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

  sectionTitle: {

    fontSize: 22,

    fontWeight: '900',

    color: GuardianColors.text,

    marginBottom: 4,

  },

  sectionSub: {

    ...Typography.body,

    color: GuardianColors.textSecondary,

    marginBottom: 18,

  },

  list: {

    gap: 12,

  },

  fab: {

    position: 'absolute',

    right: Layout.screenPadding,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    backgroundColor: GuardianColors.primary,

    paddingHorizontal: 20,

    paddingVertical: 14,

    borderRadius: 28,

  },

  fabText: {

    fontSize: 15,

    fontWeight: '800',

  },

  fabDisabled: {

    opacity: 0.55,

  },

});



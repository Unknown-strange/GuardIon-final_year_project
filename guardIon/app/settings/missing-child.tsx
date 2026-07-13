import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/errors';
import * as childrenApi from '@/api/children';
import type { ChildResponse } from '@/api/types';
import { ChildAvatar } from '@/components/guardian/child-avatar';
import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ListCardSkeletonList } from '@/components/guardian/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { isHttpsImageUrl } from '@/lib/imagekit-upload';

const HOLD_MS = 2000;

export default function MissingChildScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getChildById } = useGuardianData();
  const { bumpRefresh } = useAlertsRealtime();
  const [ownedChildren, setOwnedChildren] = useState<ChildResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<ChildResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartedRef = useRef<number | null>(null);

  const loadOwned = useCallback(async () => {
    setLoading(true);
    try {
      const children = await childrenApi.listOwnedChildren();
      setOwnedChildren(children);
    } catch {
      setOwnedChildren([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOwned();
  }, [loadOwned]);

  const selectedSummary = useMemo(
    () => (selectedChild ? getChildById(selectedChild.id) : undefined),
    [getChildById, selectedChild],
  );

  const nameMatches =
    selectedChild != null &&
    confirmName.trim().toLowerCase() === selectedChild.name.trim().toLowerCase();

  const canSubmit =
    selectedChild != null &&
    isHttpsImageUrl(selectedChild.profile_photo) &&
    nameMatches &&
    !submitting;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartedRef.current = null;
    setHoldProgress(0);
  };

  const startHold = () => {
    if (!canSubmit) return;
    holdStartedRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const started = holdStartedRef.current;
      if (!started) return;
      const progress = Math.min(1, (Date.now() - started) / HOLD_MS);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearHold();
        void submitReport();
      }
    }, 50);
  };

  const submitReport = async () => {
    if (!selectedChild || !canSubmit) return;
    setSubmitting(true);
    try {
      const result = await childrenApi.reportMissingChild(selectedChild.id, {
        notes: notes.trim() || null,
        last_seen_description: lastSeen.trim() || null,
        use_device_location: true,
      });
      showToast(
        `Missing alert sent to ${result.guardians_notified} guardian${result.guardians_notified === 1 ? '' : 's'}`,
      );
      bumpRefresh();
      setTimeout(() => router.replace('/(tabs)/alerts' as any), 1200);
    } catch (error) {
      Alert.alert('Could not send alert', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const selectChild = (child: ChildResponse) => {
    if (!isHttpsImageUrl(child.profile_photo)) {
      Alert.alert(
        'Profile photo required',
        'Add a cloud profile photo for this child in Children & Devices before reporting missing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to children',
            onPress: () => router.push('/settings/family-devices' as any),
          },
        ],
      );
      return;
    }
    setSelectedChild(child);
    setConfirmName('');
    setNotes('');
    setLastSeen('');
  };

  if (selectedChild) {
    return (
      <ThemedView style={styles.screen}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedChild(null)}
              style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={GuardianColors.text} />
            </Pressable>
            <ThemedText style={styles.title}>Confirm alert</ThemedText>
            <View style={styles.backBtn} />
          </View>

          <View style={styles.confirmHero}>
            <ChildAvatar
              childId={selectedChild.id}
              size={120}
              borderRadius={16}
              imageUri={selectedChild.profile_photo}
            />
            <ThemedText style={styles.confirmName}>{selectedChild.name}</ThemedText>
            {selectedSummary?.location ? (
              <ThemedText style={styles.confirmLoc}>{selectedSummary.location}</ThemedText>
            ) : null}
          </View>

          <ThemedText style={styles.warning}>
            This will immediately alert every guardian linked to {selectedChild.name}. Only use
            when you believe the child is missing.
          </ThemedText>

          <ThemedText style={styles.fieldLabel}>Last seen details (optional)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Blue jacket, near school gate"
            placeholderTextColor={GuardianColors.textMuted}
            value={lastSeen}
            onChangeText={setLastSeen}
            multiline
          />

          <ThemedText style={styles.fieldLabel}>Notes for guardians (optional)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Any extra context for co-guardians"
            placeholderTextColor={GuardianColors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <ThemedText style={styles.fieldLabel}>
            Type {selectedChild.name} to confirm
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder={selectedChild.name}
            placeholderTextColor={GuardianColors.textMuted}
            value={confirmName}
            onChangeText={setConfirmName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPressIn={startHold}
            onPressOut={clearHold}
            style={[
              styles.holdBtn,
              !canSubmit && styles.holdBtnDisabled,
              holdProgress > 0 && styles.holdBtnActive,
            ]}>
            <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
            <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.holdText}>
              {submitting
                ? 'Sending alert…'
                : canSubmit
                  ? 'Hold to report missing'
                  : 'Enter child name to enable'}
            </ThemedText>
          </Pressable>

          <SecondaryButton label="Cancel" onPress={() => setSelectedChild(null)} />
        </ScrollView>

        <GuardianToast
          visible={toastVisible}
          message={toastMessage}
          onHide={() => setToastVisible(false)}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.text} />
          </Pressable>
          <ThemedText style={styles.title}>Missing Child Alert</ThemedText>
          <View style={styles.backBtn} />
        </View>

        <ThemedText style={styles.subtitle}>
          Select a child you own as primary guardian. All linked guardians will receive an in-app
          alert, push notification, and live update with the child&apos;s photo.
        </ThemedText>

        {loading ? (
          <ListCardSkeletonList variant="child-managed" count={3} />
        ) : ownedChildren.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={GuardianColors.textMuted} />
            <ThemedText style={styles.emptyTitle}>No owned children</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Register a child under Children & Devices to use this feature.
            </ThemedText>
            <PrimaryButton
              label="Go to Children & Devices"
              onPress={() => router.push('/settings/family-devices' as any)}
            />
          </View>
        ) : (
          ownedChildren.map((child, index) => (
            <Animated.View
              key={child.id}
              entering={FadeInDown.delay(index * 50).duration(260)}>
              <Pressable
                accessibilityRole="button"
                onPress={() => selectChild(child)}
                style={styles.childCard}>
                <ChildAvatar
                  childId={child.id}
                  size={56}
                  borderRadius={12}
                  imageUri={child.profile_photo}
                />
                <View style={styles.childMeta}>
                  <ThemedText style={styles.childName}>{child.name}</ThemedText>
                  <ThemedText style={styles.childHint}>
                    {isHttpsImageUrl(child.profile_photo)
                      ? 'Tap to report missing'
                      : 'Add cloud photo first'}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={GuardianColors.textMuted}
                />
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.section,
    color: GuardianColors.text,
  },
  subtitle: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginBottom: 16,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 14,
    marginBottom: 10,
  },
  childMeta: {
    flex: 1,
    gap: 4,
  },
  childName: {
    fontWeight: '700',
    fontSize: 16,
    color: GuardianColors.text,
  },
  childHint: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: GuardianColors.text,
  },
  emptyBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmHero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  confirmName: {
    ...Typography.hero,
    color: GuardianColors.text,
    fontSize: 22,
  },
  confirmLoc: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
  },
  warning: {
    ...Typography.body,
    color: GuardianColors.danger,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldLabel: {
    fontWeight: '700',
    color: GuardianColors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: GuardianColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    color: GuardianColors.text,
    backgroundColor: GuardianColors.surface,
    marginBottom: 4,
  },
  holdBtn: {
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: GuardianColors.danger,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdBtnDisabled: {
    opacity: 0.45,
  },
  holdBtnActive: {
    opacity: 1,
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#991B1B',
  },
  holdText: {
    fontWeight: '800',
    fontSize: 15,
    zIndex: 1,
  },
});

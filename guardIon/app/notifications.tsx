import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as notificationsApi from '@/api/notifications';
import type { NotificationResponse } from '@/api/types';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ListCardSkeletonList } from '@/components/guardian/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { usePendingGuardianInvites } from '@/hooks/use-pending-guardian-invites';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { Image } from 'expo-image';
import {
  guardianInviteDisplayText,
  parseGuardianInviteNotification,
} from '@/utils/guardian-invite-notification';
import {
  missingChildDisplayText,
  parseMissingChildNotification,
} from '@/utils/missing-child-notification';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';

function notificationBody(notification: NotificationResponse): string {
  if (notification.type === 'guardian_invite') {
    const payload = parseGuardianInviteNotification(notification.message);
    if (payload) return guardianInviteDisplayText(payload);
  }
  if (notification.type === 'child_missing') {
    const payload = parseMissingChildNotification(notification.message);
    if (payload) return missingChildDisplayText(payload);
  }
  return notification.message;
}

function missingPayloadFromNotification(
  notification: NotificationResponse,
): ReturnType<typeof parseMissingChildNotification> {
  if (notification.type !== 'child_missing') return null;
  return parseMissingChildNotification(notification.message);
}

function guardianIdFromNotification(notification: NotificationResponse): string | null {
  if (notification.type !== 'guardian_invite') return null;
  return parseGuardianInviteNotification(notification.message)?.guardian_id ?? null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshChildren } = useGuardianData();
  const { acceptInvite, refreshInvites } = usePendingGuardianInvites();
  const { openMissingChildAlert } = useAlertsRealtime();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsApi.listNotifications({ limit: 100 });
      setNotifications(response.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([loadNotifications(), refreshInvites()]);
  }, [loadNotifications, refreshInvites]);

  const handleAcceptInvite = useCallback(
    async (notification: NotificationResponse) => {
      const guardianId = guardianIdFromNotification(notification);
      if (!guardianId) return;

      setAcceptingId(notification.id);
      try {
        await acceptInvite(guardianId);
        await notificationsApi.markNotificationsRead([notification.id]);
        await refreshChildren();
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
        router.replace('/(tabs)/' as any);
      } finally {
        setAcceptingId(null);
      }
    },
    [acceptInvite, refreshChildren, router],
  );

  const handleViewMissingChild = useCallback(
    async (notification: NotificationResponse) => {
      const payload = missingPayloadFromNotification(notification);
      if (!payload) return;

      if (!notification.read) {
        await notificationsApi.markNotificationsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
      }

      openMissingChildAlert({
        alert_id: payload.alert_id,
        alert_type: 'child_missing',
        child_id: payload.child_id,
        child_name: payload.child_name,
        image_url: payload.image_url,
        reporter_name: payload.reporter_name,
        notes: payload.notes,
        location_lat: payload.location_lat ?? undefined,
        location_lng: payload.location_lng ?? undefined,
        status: 'active',
        created_at: notification.sent_at,
      });
      router.push('/(tabs)/alerts' as any);
    },
    [openMissingChildAlert, router],
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={GuardianColors.text} />
          </Pressable>
          <ThemedText style={styles.title}>Notifications</ThemedText>
          <View style={styles.backBtn} />
        </View>

        {isLoading ? (
          <ListCardSkeletonList variant="guardian" count={4} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={32} color={GuardianColors.textMuted} />
            <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Co-guardian invites and alerts will appear here.
            </ThemedText>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const guardianId = guardianIdFromNotification(notification);
            const isInvite = notification.type === 'guardian_invite' && guardianId;
            const missingPayload = missingPayloadFromNotification(notification);
            const isMissing = notification.type === 'child_missing' && missingPayload;

            return (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.delay(index * 40).duration(260)}>
                <View
                  style={[
                    styles.card,
                    !notification.read && styles.cardUnread,
                  ]}>
                  <View style={styles.cardHeader}>
                    <Ionicons
                      name={
                        isInvite
                          ? 'people-outline'
                          : isMissing
                            ? 'alert-circle-outline'
                            : 'notifications-outline'
                      }
                      size={18}
                      color={isMissing ? GuardianColors.danger : GuardianColors.primary}
                    />
                    <ThemedText style={styles.cardTitle}>{notification.title}</ThemedText>
                  </View>
                  {isMissing && missingPayload?.image_url ? (
                    <Image
                      source={{ uri: missingPayload.image_url }}
                      style={styles.missingPhoto}
                      contentFit="cover"
                    />
                  ) : null}
                  <ThemedText style={styles.cardBody}>
                    {notificationBody(notification)}
                  </ThemedText>
                  {isMissing && missingPayload?.notes ? (
                    <ThemedText style={styles.cardNotes}>{missingPayload.notes}</ThemedText>
                  ) : null}
                  <ThemedText style={styles.cardTime}>
                    {new Date(notification.sent_at).toLocaleString()}
                  </ThemedText>
                  {isInvite && !notification.read ? (
                    <PrimaryButton
                      label={
                        acceptingId === notification.id
                          ? 'Accepting…'
                          : 'Accept invite'
                      }
                      onPress={() => handleAcceptInvite(notification)}
                      disabled={acceptingId === notification.id}
                    />
                  ) : null}
                  {isMissing ? (
                    <PrimaryButton
                      variant="danger"
                      label="View alert"
                      onPress={() => handleViewMissingChild(notification)}
                    />
                  ) : null}
                </View>
              </Animated.View>
            );
          })
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
    marginBottom: 16,
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
  loader: {
    marginTop: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  emptyBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  cardUnread: {
    borderColor: GuardianColors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.text,
    flex: 1,
  },
  cardBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  cardNotes: {
    ...Typography.caption,
    color: GuardianColors.text,
    fontStyle: 'italic',
  },
  missingPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: GuardianColors.border,
  },
  cardTime: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
});

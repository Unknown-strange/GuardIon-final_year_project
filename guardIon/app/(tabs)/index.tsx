import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoGuardianInviteCard } from '@/components/guardian/co-guardian-invite-card';
import { ChildSummaryCard } from '@/components/guardian/child-summary-card';
import { ListCardSkeletonList } from '@/components/guardian/skeleton';
import { GuardianFab } from '@/components/guardian/fab';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { usePendingGuardianInvites } from '@/hooks/use-pending-guardian-invites';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type IonName = keyof typeof Ionicons.glyphMap;

type TipSlide = {
  id: string;
  icon: IonName;
  iconColor: string;
  title: string;
  body: string;
};

const SAFETY_TIPS: TipSlide[] = [
  {
    id: '1',
    icon: 'shield-checkmark',
    iconColor: GuardianColors.safe,
    title: "The 'Safe Adults' Rule",
    body:
      'Teach children to recognize trusted adults—school staff, uniformed officers, and the contacts you list in the app—and when it is okay to ask them for help.',
  },
  {
    id: '2',
    icon: 'call-outline',
    iconColor: GuardianColors.primary,
    title: 'Emergency Contacts',
    body:
      'Practice memorizing two phone numbers together so your child can reach you even if their device is unavailable.',
  },
  {
    id: '3',
    icon: 'location-outline',
    iconColor: GuardianColors.warning,
    title: 'Know Your Routes',
    body:
      'Walk school and playground routes together occasionally so your child knows landmarks and where to go if they feel unsure.',
  },
  {
    id: '4',
    icon: 'people-outline',
    iconColor: GuardianColors.primaryDark,
    title: 'Buddy System',
    body:
      'Encourage pairing up with a sibling or friend for walks home so someone always knows where they are.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { children, isLoading, refreshChildren, loadError, clearLoadError } = useGuardianData();
  const { invites, acceptInvite, declineInvite, isLoading: invitesLoading } =
    usePendingGuardianInvites(isFocused);
  const [query, setQuery] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [animatedChildId, setAnimatedChildId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Initial load is handled by GuardianDataProvider; debounce tab revisits.
      void refreshChildren({ background: true });
    }, [refreshChildren]),
  );

  const handleAcceptInvite = useCallback(
    async (guardianId: string) => {
      const invite = invites.find((item) => item.id === guardianId);
      await acceptInvite(guardianId);
      if (invite) {
        setAnimatedChildId(invite.child_id);
      }
      await refreshChildren();
    },
    [acceptInvite, invites, refreshChildren],
  );

  const screenW = Dimensions.get('window').width;
  const carouselPageWidth = screenW;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return children;
    return children.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.deviceLabel.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [children, query]);

  const activeDevices = children.filter((c) => c.connectionStatus === 'online').length;
  const hasChildren = children.length > 0;
  const showEmptyState = !isLoading && !hasChildren;

  const fabBottom = Math.max(insets.bottom, 12) + 16;
  const scrollBottomPadding = fabBottom + 56 + 12;

  const onTipScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / carouselPageWidth);
    if (next !== tipIndex && next >= 0 && next < SAFETY_TIPS.length) {
      setTipIndex(next);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: scrollBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader onBellPress={() => router.push('/notifications' as any)} />

        {loadError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color={GuardianColors.danger} />
            <ThemedText style={styles.errorText}>{loadError}</ThemedText>
            <PrimaryButton
              label="Retry"
              onPress={() => {
                clearLoadError();
                void refreshChildren();
              }}
            />
          </View>
        ) : null}

        <SectionTitle
          title="My Children"
          right={
            <View style={styles.pill}>
              <ThemedText style={styles.pillText}>Active Devices: {activeDevices}</ThemedText>
            </View>
          }
        />

        {hasChildren ? (
          <View style={styles.searchShell}>
            <Ionicons name="search" size={18} color={GuardianColors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by Name:"
              placeholderTextColor={GuardianColors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}

        {invitesLoading && invites.length === 0 ? (
          <ListCardSkeletonList variant="invite" count={1} />
        ) : (
          invites.map((invite) => (
            <CoGuardianInviteCard
              key={invite.id}
              invite={invite}
              onAccept={handleAcceptInvite}
              onDecline={declineInvite}
            />
          ))
        )}

        {isLoading && !hasChildren ? (
          <ListCardSkeletonList variant="child-summary" count={2} />
        ) : showEmptyState ? (
          <View style={styles.emptyState}>
            <Image
              source={require('@/assets/placeholder_images/no-child.png')}
              style={styles.emptyImage}
              contentFit="contain"
            />
            <ThemedText style={styles.emptyTitle}>No Children Added Yet</ThemedText>
            <ThemedText style={styles.emptyBody}>
              Add your first child to begin safety monitoring and receive real-time updates.
            </ThemedText>
          </View>
        ) : (
          filtered.map((item) => (
            <Animated.View
              key={item.id}
              entering={
                animatedChildId === item.id ? FadeInDown.duration(420) : undefined
              }>
              <ChildSummaryCard
                item={item}
                onPress={() => router.push(`/child/${item.id}` as any)}
                onLongPress={() =>
                  router.push({
                    pathname: '/(tabs)/map',
                    params: { childId: item.id },
                  } as any)
                }
              />
            </Animated.View>
          ))
        )}

        {hasChildren ? <PrimaryButton label="View all" onPress={() => {}} /> : null}

        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={22} color={GuardianColors.primary} />
          <ThemedText style={styles.tipsTitle}>Daily Child Safety Tips</ThemedText>
        </View>

        <View style={styles.carouselBleed}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={carouselPageWidth}
            snapToAlignment="center"
            onMomentumScrollEnd={onTipScroll}
            onScrollEndDrag={onTipScroll}
            style={{ width: carouselPageWidth }}
            contentContainerStyle={styles.carouselContent}>
            {SAFETY_TIPS.map((tip) => (
              <View key={tip.id} style={[styles.tipPage, { width: carouselPageWidth }]}>
                <View style={styles.tipCard}>
                  <View style={styles.tipRow}>
                    <Ionicons name={tip.icon} size={20} color={tip.iconColor} />
                    <ThemedText style={styles.tipCardTitle}>{tip.title}</ThemedText>
                  </View>
                  <ThemedText style={styles.tipBody}>{tip.body}</ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dots}>
            {SAFETY_TIPS.map((tip, i) => (
              <View key={tip.id} style={[styles.dot, i === tipIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      </ScrollView>

      <GuardianFab
        accessibilityLabel="Add child"
        onPress={() => router.push('/settings/family-devices?add=1' as any)}
        style={[styles.fab, { bottom: fabBottom }]}
      />
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
  pill: {
    backgroundColor: GuardianColors.navyMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    ...Typography.caption,
    color: GuardianColors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: GuardianColors.dangerMuted,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: GuardianColors.danger,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    ...Typography.body,
    color: GuardianColors.danger,
  },
  searchShell: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  emptyImage: {
    width: 240,
    height: 240,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GuardianColors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 12,
  },
  tipsTitle: {
    ...Typography.section,
    color: GuardianColors.text,
  },
  carouselBleed: {
    marginHorizontal: -Layout.screenPadding,
    marginBottom: 0,
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  tipPage: {
    paddingHorizontal: Layout.screenPadding,
  },
  tipCard: {
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.text,
    flex: 1,
  },
  tipBody: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: Layout.screenPadding,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GuardianColors.borderStrong,
  },
  dotActive: {
    backgroundColor: GuardianColors.primary,
    width: 22,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: Layout.screenPadding,
  },
});

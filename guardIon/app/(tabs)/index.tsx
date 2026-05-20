import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChildSummaryCard } from '@/components/guardian/child-summary-card';
import { GuardianFab } from '@/components/guardian/fab';
import { PrimaryButton } from '@/components/guardian/buttons';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { SectionTitle } from '@/components/guardian/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGuardianData } from '@/contexts/guardian-data-context';
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
  const { children, isLoading } = useGuardianData();
  const [query, setQuery] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

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

  const activeDevices = children.filter((c) => c.online).length;

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
        <ScreenHeader />

        <SectionTitle
          title="My Children"
          right={
            <View style={styles.pill}>
              <ThemedText style={styles.pillText}>Active Devices: {activeDevices}</ThemedText>
            </View>
          }
        />

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

        {filtered.map((item) => (
          <ChildSummaryCard
            key={item.id}
            item={item}
            onPress={() => router.push(`/child/${item.id}` as any)}
            onLongPress={() =>
              router.push({
                pathname: '/(tabs)/map',
                params: { childId: item.id },
              } as any)
            }
          />
        ))}

        <PrimaryButton label="View all" onPress={() => {}} />

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
        accessibilityLabel="Open map to add devices or zones"
        onPress={() => router.push('/map' as any)}
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

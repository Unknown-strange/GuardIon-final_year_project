import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/guardian/buttons';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type Filter = 'all' | 'active' | 'resolved';

type AlertItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  accent: 'red' | 'yellow' | 'gray';
  location?: string;
  state: 'active' | 'resolved';
};

const DATA: AlertItem[] = [
  {
    id: '1',
    title: 'SOS Signal Activated',
    body: "Manual trigger from Leo's Smartwatch",
    time: '2m ago',
    accent: 'red',
    location: 'Central Park East, NY',
    state: 'active',
  },
  {
    id: '2',
    title: 'Geofence Exit',
    body: "Leo left the 'School Zone' boundary",
    time: '45m ago',
    accent: 'yellow',
    state: 'active',
  },
  {
    id: '3',
    title: 'Device is now charging',
    body: 'System',
    time: '45m ago',
    accent: 'gray',
    state: 'resolved',
  },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(() => {
    if (filter === 'active') return DATA.filter((d) => d.state === 'active');
    if (filter === 'resolved') return DATA.filter((d) => d.state === 'resolved');
    return DATA;
  }, [filter]);

  const activeAlerts = DATA.filter((d) => d.state === 'active').length;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader />

        <ThemedText style={styles.pageTitle}>Alerts</ThemedText>
        <ThemedText style={styles.pageSub}>
          Stay updated on your child&apos;s safety status.
        </ThemedText>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>ACTIVE ALERTS</ThemedText>
            <ThemedText style={styles.summaryRed}>{activeAlerts}</ThemedText>
            <View style={styles.summaryFoot}>
              <Ionicons name="warning" size={16} color={GuardianColors.danger} />
              <ThemedText style={styles.summaryFootRed}>ALERT TRIGGERED</ThemedText>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>CHILD STATUS</ThemedText>
            <ThemedText style={styles.summaryGreen}>Safe</ThemedText>
            <ThemedText style={styles.summaryMuted}>Updated 1m ago</ThemedText>
          </View>
        </View>

        <View style={styles.segment}>
          {(['all', 'active', 'resolved'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.segmentItem, filter === key && styles.segmentItemOn]}>
              <ThemedText
                style={[styles.segmentText, filter === key && styles.segmentTextOn]}>
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Resolved'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <ThemedText style={styles.sectionTitle}>Recent Alerts</ThemedText>
          <Pressable>
            <ThemedText style={styles.link}>View All</ThemedText>
          </Pressable>
        </View>

        {list
          .filter((i) => i.state === 'active')
          .map((item) => (
            <View key={item.id} style={styles.alertCard}>
              <View
                style={[
                  styles.alertRail,
                  item.accent === 'red' && { backgroundColor: GuardianColors.danger },
                  item.accent === 'yellow' && { backgroundColor: GuardianColors.warning },
                ]}
              />
              <View style={styles.alertBody}>
                <View style={styles.alertTop}>
                  <View style={styles.alertIcon}>
                    <Ionicons name="navigate-circle" size={22} color={GuardianColors.danger} />
                  </View>
                  <ThemedText style={styles.alertTime}>{item.time}</ThemedText>
                </View>
                <ThemedText style={styles.alertTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.alertDesc}>{item.body}</ThemedText>
                {item.location ? (
                  <View style={styles.locPill}>
                    <Ionicons name="location-outline" size={14} color={GuardianColors.textSecondary} />
                    <ThemedText style={styles.locText}>{item.location}</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

        <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Resolved</ThemedText>
        {list
          .filter((i) => i.state === 'resolved')
          .map((item) => (
            <View key={item.id} style={styles.resolvedCard}>
              <Ionicons name="battery-charging" size={22} color={GuardianColors.textSecondary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.alertTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.alertDesc}>{item.body}</ThemedText>
              </View>
              <View style={styles.resolvedRight}>
                <ThemedText style={styles.alertTime}>{item.time}</ThemedText>
                <ThemedText style={styles.resolvedBadge}>RESOLVED</ThemedText>
              </View>
            </View>
          ))}

        <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Emergency Contacts</ThemedText>
        <View style={styles.contact}>
          <View style={styles.avatarSm}>
            <Ionicons name="person" size={20} color={GuardianColors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.contactName}>Sarah (Mom)</ThemedText>
            <ThemedText style={styles.contactRole}>Primary contact</ThemedText>
          </View>
          <Pressable style={styles.phoneBlue}>
            <Ionicons name="call" size={18} color={GuardianColors.primary} />
          </Pressable>
        </View>
        <View style={styles.contact}>
          <View style={[styles.avatarSm, styles.avatarEmergency]}>
            <Ionicons name="medical" size={20} color={GuardianColors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.contactName}>Local Emergency service</ThemedText>
            <ThemedText style={styles.contactRole}>Police</ThemedText>
          </View>
          <Pressable style={styles.phoneRed}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={{ marginTop: 8 }}>
          <PrimaryButton variant="danger" label="EMERGENCY SOS" onPress={() => router.push('/child/1' as any)} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GuardianColors.background,
  },
  pageTitle: {
    ...Typography.hero,
    color: GuardianColors.text,
    marginTop: 8,
  },
  pageSub: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  summaryLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  summaryRed: {
    fontSize: 32,
    fontWeight: '900',
    color: GuardianColors.danger,
    marginTop: 6,
  },
  summaryFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  summaryFootRed: {
    fontWeight: '800',
    color: GuardianColors.danger,
    fontSize: 12,
  },
  summaryGreen: {
    fontSize: 26,
    fontWeight: '900',
    color: GuardianColors.safe,
    marginTop: 8,
  },
  summaryMuted: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 8,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentItemOn: {
    backgroundColor: GuardianColors.navyMuted,
  },
  segmentText: {
    fontWeight: '700',
    color: GuardianColors.textSecondary,
    fontSize: 13,
  },
  segmentTextOn: {
    color: GuardianColors.primary,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.section,
    color: GuardianColors.text,
  },
  link: {
    fontWeight: '700',
    color: GuardianColors.primary,
    fontSize: 14,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  alertRail: {
    width: 5,
    backgroundColor: GuardianColors.border,
  },
  alertBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GuardianColors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTime: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.text,
  },
  alertDesc: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
  },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: GuardianColors.overlaySheet,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  locText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 10,
  },
  resolvedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resolvedBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: GuardianColors.safe,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GuardianColors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    marginBottom: 10,
  },
  avatarSm: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmergency: {
    backgroundColor: GuardianColors.dangerMuted,
  },
  contactName: {
    fontWeight: '800',
    color: GuardianColors.text,
    fontSize: 16,
  },
  contactRole: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    marginTop: 2,
  },
  phoneBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

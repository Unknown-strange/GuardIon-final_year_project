import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveAlertsSummary } from '@/components/guardian/active-alerts-summary';
import { AlertsChildSelector } from '@/components/guardian/alerts-child-selector';
import { PrimaryButton } from '@/components/guardian/buttons';
import { CheckInSheet } from '@/components/guardian/check-in-sheet';
import { ChildContactsSheet } from '@/components/guardian/child-contacts-sheet';
import { ContactRow } from '@/components/guardian/contact-row';
import { EmergencySosModal } from '@/components/guardian/emergency-sos-modal';
import { GeofenceAlertActions } from '@/components/guardian/geofence-alert-actions';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getActiveAlertCount,
  getActiveAlertCountsByChild,
  getAlertsForChild,
  useAlerts,
} from '@/hooks/use-alerts';
import { useCheckIn } from '@/hooks/use-check-in';
import { useSafeZones } from '@/hooks/use-safe-zones';
import type { AlertItem } from '@/constants/alerts-mocks';
import { getContactsForChild } from '@/constants/child-contacts-mocks';
import { useAlertsRealtime } from '@/contexts/alerts-realtime-context';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import type { ChildContact } from '@/types/child-contact';
import { callPhone } from '@/utils/phone';

type Filter = 'all' | 'active' | 'resolved';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function alertIcon(type?: AlertItem['type']) {
  switch (type) {
    case 'sos':
      return 'warning' as const;
    case 'geofence':
      return 'navigate-circle' as const;
    case 'check_in':
      return 'shield-checkmark' as const;
    case 'battery':
      return 'battery-dead' as const;
    default:
      return 'information-circle' as const;
  }
}

function aggregateStatus(
  selectedChildId: string | null,
  children: ReturnType<typeof useGuardianData>['children'],
  getChildById: ReturnType<typeof useGuardianData>['getChildById'],
) {
  if (selectedChildId) {
    const child = getChildById(selectedChildId);
    if (!child) {
      return { label: 'Unknown', variant: 'offline' as const, updated: 'Updated just now' };
    }
    return {
      label:
        child.status === 'safe'
          ? 'Safe'
          : child.status === 'warning'
            ? 'Attention'
            : child.status === 'offline'
              ? 'Offline'
              : 'Alert',
      variant: child.status === 'safe' ? ('safe' as const) : child.status === 'warning' ? ('warning' as const) : child.status === 'offline' ? ('offline' as const) : ('danger' as const),
      updated: `Updated ${child.lastUpdate}`,
    };
  }

  const hasWarning = children.some((c) => c.status === 'warning');
  const hasOffline = children.some((c) => c.status === 'offline');
  return {
    label: hasWarning ? 'Mixed' : hasOffline ? 'Check devices' : 'Mostly safe',
    variant: hasWarning ? ('warning' as const) : hasOffline ? ('offline' as const) : ('safe' as const),
    updated: 'Updated just now',
  };
}

function getContactsChildId(selectedChildId: string | null, children: { id: string }[]) {
  if (selectedChildId) return selectedChildId;
  return children[0]?.id ?? '';
}

function getSosTargetChildId(selectedChildId: string | null, children: { id: string }[]) {
  if (selectedChildId) return selectedChildId;
  return children[0]?.id ?? '';
}

function EmptyAlerts({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-off-outline" size={28} color={GuardianColors.textMuted} />
      </View>
      <ThemedText style={styles.emptyTitle}>{message}</ThemedText>
      <ThemedText style={styles.emptySub}>Alerts for this filter will appear here.</ThemedText>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const { children, getChildById } = useGuardianData();
  const { deviceSafeCheck } = useAlertsRealtime();
  const { allAlerts, resolveAlertById } = useAlerts('all');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactChildId, setContactChildId] = useState('');
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInChildId, setCheckInChildId] = useState('');
  const [sosOpen, setSosOpen] = useState(false);
  const [sosChildId, setSosChildId] = useState('');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);

  const checkInChild = getChildById(checkInChildId);
  const {
    status: checkInStatus,
    lastLabel: checkInLastLabel,
    start: startCheckIn,
    cancel: cancelCheckIn,
    canCheckIn,
  } = useCheckIn(checkInOpen ? checkInChildId : null, checkInChild?.online ?? false);

  const sosChild = getChildById(sosChildId);
  const { childZones: sosZones } = useSafeZones(sosChildId || null);

  useEffect(() => {
    if (params.childId && typeof params.childId === 'string') {
      const exists = children.some((c) => c.id === params.childId);
      if (exists) {
        animateLayout();
        setSelectedChildId(params.childId);
      }
    }
  }, [children, params.childId]);

  const activeCounts = useMemo(() => getActiveAlertCountsByChild(allAlerts), [allAlerts]);
  const childAlerts = useMemo(
    () => (selectedChildId === null ? allAlerts : getAlertsForChild(allAlerts, selectedChildId)),
    [allAlerts, selectedChildId],
  );

  const filtered = useMemo(() => {
    if (filter === 'active') return childAlerts.filter((d) => d.state === 'active');
    if (filter === 'resolved') return childAlerts.filter((d) => d.state === 'resolved');
    return childAlerts;
  }, [childAlerts, filter]);

  const activeAlerts = useMemo(
    () =>
      selectedChildId === null
        ? getActiveAlertCount(allAlerts)
        : getAlertsForChild(allAlerts, selectedChildId).filter((a) => a.state === 'active').length,
    [allAlerts, selectedChildId],
  );
  const activeList = filtered.filter((i) => i.state === 'active');
  const resolvedList = filtered.filter((i) => i.state === 'resolved');

  const selectionLabel =
    selectedChildId === null ? 'All children' : (getChildById(selectedChildId)?.name ?? 'Child');
  const status = aggregateStatus(selectedChildId, children, getChildById);
  const contactsChildIdResolved = getContactsChildId(selectedChildId, children);
  const emergencyContacts = getContactsForChild(contactsChildIdResolved).slice(0, 2);
  const sosTargetChildId = getSosTargetChildId(selectedChildId, children);
  const contactChild = getChildById(contactChildId || contactsChildIdResolved);

  const selectChild = useCallback((childId: string | null) => {
    animateLayout();
    setSelectedChildId(childId);
  }, []);

  const selectFilter = useCallback((key: Filter) => {
    animateLayout();
    setFilter(key);
  }, []);

  const openContacts = (childId: string) => {
    setContactChildId(childId);
    setContactsOpen(true);
  };

  const openCheckIn = (childId: string) => {
    cancelCheckIn();
    setCheckInChildId(childId);
    setCheckInOpen(true);
  };

  const closeCheckIn = () => {
    cancelCheckIn();
    setCheckInOpen(false);
  };

  useEffect(() => {
    if (!checkInOpen || !checkInChildId) return;
    if (deviceSafeCheck?.childId === checkInChildId) {
      closeCheckIn();
      return;
    }
    if (checkInStatus === 'confirmed') {
      const timer = setTimeout(() => closeCheckIn(), 1200);
      return () => clearTimeout(timer);
    }
  }, [deviceSafeCheck, checkInOpen, checkInChildId, checkInStatus, closeCheckIn]);

  const openEmergencySos = (childId: string) => {
    setSosChildId(childId);
    setSosOpen(true);
  };

  const markChildSafe = (item: AlertItem) => {
    const childName = getChildById(item.childId)?.name ?? 'Child';
    Alert.alert(
      'Confirm child is safe?',
      `${childName} is outside the safe zone. Mark this alert as resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Child is safe',
          onPress: () => {
            animateLayout();
            setResolvingAlertId(item.id);
            void resolveAlertById(item.id, 'Guardian confirmed child is safe').finally(() => {
              setResolvingAlertId(null);
            });
          },
        },
      ],
    );
  };

  const dialContact = (contact: ChildContact) => {
    const dial = () => void callPhone(contact.phone, contact.name);

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

  const emptyActiveMessage =
    selectedChildId === null
      ? 'No active alerts across your children'
      : `No active alerts for ${getChildById(selectedChildId)?.name ?? 'this child'}`;

  const emptyResolvedMessage =
    selectedChildId === null
      ? 'No resolved alerts yet'
      : `No resolved alerts for ${getChildById(selectedChildId)?.name ?? 'this child'}`;

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

        <Animated.View entering={FadeInDown.duration(300)}>
          <ThemedText style={styles.pageTitle}>Alerts</ThemedText>
          <ThemedText style={styles.pageSub}>
            Choose a child to review their safety alerts.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(320)}>
          <AlertsChildSelector
            items={children}
            selectedChildId={selectedChildId}
            activeCounts={activeCounts}
            onSelect={selectChild}
          />
        </Animated.View>

        <ActiveAlertsSummary
          key={selectedChildId ?? 'all'}
          activeCount={activeAlerts}
          selectionLabel={selectionLabel}
          statusLabel={status.label}
          statusVariant={status.variant}
          updatedLabel={status.updated}
        />

        <Animated.View entering={FadeInDown.delay(220).duration(300)} style={styles.segment}>
          {(['all', 'active', 'resolved'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => selectFilter(key)}
              style={[styles.segmentItem, filter === key && styles.segmentItemOn]}>
              <ThemedText style={[styles.segmentText, filter === key && styles.segmentTextOn]}>
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Resolved'}
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>

        <View style={styles.sectionHead}>
          <ThemedText style={styles.sectionTitle}>
            {filter === 'resolved' ? 'Resolved Alerts' : 'Recent Alerts'}
          </ThemedText>
        </View>

        {filter !== 'resolved' ? (
          activeList.length === 0 ? (
            <EmptyAlerts message={emptyActiveMessage} />
          ) : (
            activeList.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.delay(index * 60).springify()}>
                <View style={styles.alertCard}>
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
                        <Ionicons
                          name={alertIcon(item.type)}
                          size={22}
                          color={
                            item.accent === 'red'
                              ? GuardianColors.danger
                              : item.accent === 'yellow'
                                ? GuardianColors.warning
                                : GuardianColors.textSecondary
                          }
                        />
                      </View>
                      <ThemedText style={styles.alertTime}>{item.time}</ThemedText>
                    </View>
                    <ThemedText style={styles.alertTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.alertDesc}>{item.body}</ThemedText>
                    {selectedChildId === null ? (
                      <ThemedText style={styles.childTag}>
                        {getChildById(item.childId)?.name ?? 'Child'}
                      </ThemedText>
                    ) : null}
                    {item.location ? (
                      <View style={styles.locPill}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={GuardianColors.textSecondary}
                        />
                        <ThemedText style={styles.locText}>{item.location}</ThemedText>
                      </View>
                    ) : null}
                    {item.type === 'geofence' ? (
                      <GeofenceAlertActions
                        childName={getChildById(item.childId)?.name ?? 'Child'}
                        onCheckIn={() => openCheckIn(item.childId)}
                        onEmergencySos={() => openEmergencySos(item.childId)}
                        onMarkSafe={() => markChildSafe(item)}
                        markingSafe={resolvingAlertId === item.id}
                      />
                    ) : null}
                    {item.type === 'sos' ? (
                      <View style={styles.sosActions}>
                        <Pressable
                          style={styles.sosCallBtn}
                          onPress={() => openContacts(item.childId)}>
                          <Ionicons name="call" size={16} color="#FFFFFF" />
                          <ThemedText lightColor="#FFF" darkColor="#FFF" style={styles.sosCallText}>
                            Call contacts
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          style={styles.sosViewBtn}
                          onPress={() => router.push(`/child/${item.childId}` as any)}>
                          <ThemedText style={styles.sosViewText}>View child</ThemedText>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            ))
          )
        ) : null}

        {filter === 'all' && activeList.length > 0 && resolvedList.length > 0 ? (
          <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Resolved</ThemedText>
        ) : null}

        {filter !== 'active' ? (
          resolvedList.length === 0 && filter === 'resolved' ? (
            <EmptyAlerts message={emptyResolvedMessage} />
          ) : (
            resolvedList.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.delay(index * 60).springify()}>
                <View style={styles.resolvedCard}>
                  <Ionicons
                    name={item.type === 'battery' ? 'battery-charging' : 'checkmark-circle-outline'}
                    size={22}
                    color={GuardianColors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.alertTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.alertDesc}>{item.body}</ThemedText>
                    {selectedChildId === null ? (
                      <ThemedText style={styles.childTag}>
                        {getChildById(item.childId)?.name ?? 'Child'}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.resolvedRight}>
                    <ThemedText style={styles.alertTime}>{item.time}</ThemedText>
                    <ThemedText style={styles.resolvedBadge}>RESOLVED</ThemedText>
                  </View>
                </View>
              </Animated.View>
            ))
          )
        ) : null}

        <Animated.View entering={FadeInDown.delay(280).duration(300)}>
          <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Emergency Contacts</ThemedText>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactWrap}>
              <ContactRow contact={contact} onPress={() => dialContact(contact)} />
            </View>
          ))}

          <View style={{ marginTop: 8 }}>
            <PrimaryButton
              variant="danger"
              label="EMERGENCY SOS"
              onPress={() => openEmergencySos(sosTargetChildId)}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <ChildContactsSheet
        visible={contactsOpen}
        childId={contactChildId}
        childName={contactChild?.name ?? 'Child'}
        onClose={() => setContactsOpen(false)}
      />

      <CheckInSheet
        visible={checkInOpen}
        childName={checkInChild?.name ?? 'Child'}
        status={checkInStatus}
        lastLabel={checkInLastLabel}
        canCheckIn={canCheckIn}
        onClose={closeCheckIn}
        onConfirm={startCheckIn}
        onCall={() => {
          closeCheckIn();
          if (checkInChildId) openContacts(checkInChildId);
        }}
        onViewMap={() => {
          closeCheckIn();
          if (checkInChildId) router.push(`/child/${checkInChildId}` as any);
        }}
      />

      {sosChild ? (
        <EmergencySosModal
          visible={sosOpen}
          child={sosChild}
          zones={sosZones}
          liveAddress={sosChild.location}
          onClose={() => setSosOpen(false)}
          onAcknowledge={() => {}}
        />
      ) : null}
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
    marginBottom: 4,
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
  childTag: {
    ...Typography.caption,
    color: GuardianColors.primary,
    fontWeight: '800',
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
  contactWrap: {
    marginBottom: 10,
  },
  sosActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  sosCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GuardianColors.danger,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sosCallText: {
    fontWeight: '800',
    fontSize: 14,
  },
  sosViewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GuardianColors.navyMuted,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  sosViewText: {
    fontWeight: '800',
    color: GuardianColors.primary,
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GuardianColors.overlaySheet,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: GuardianColors.text,
    textAlign: 'center',
  },
  emptySub: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});

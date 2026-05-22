import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardianToast } from '@/components/guardian/guardian-toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_LOGGED_IN_DEVICES,
  type LoggedInDevice,
} from '@/constants/security-mocks';
import * as preferencesApi from '@/api/preferences';
import { useAuth } from '@/contexts/auth-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

function mapSession(session: preferencesApi.UserSession): LoggedInDevice {
  return {
    id: session.id,
    name: session.device_name,
    platform: session.platform ?? 'unknown',
    location: '—',
    lastActive: new Date(session.last_active).toLocaleString(),
    isCurrent: session.is_current,
  };
}

export default function LoggedInDevicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [devices, setDevices] = useState<LoggedInDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await preferencesApi.listUserSessions();
      setDevices(res.sessions.map(mapSession));
    } catch {
      setDevices(MOCK_LOGGED_IN_DEVICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleRevoke = (device: LoggedInDevice) => {
    if (device.isCurrent) {
      Alert.alert(
        'Sign out of this device?',
        'You will be logged out of GuardIon on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign out',
            style: 'destructive',
            onPress: () => {
              void signOut().then(() => router.replace('/authentication/signin' as any));
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      'Remove session?',
      `${device.name} will be signed out and will need to log in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await preferencesApi.revokeUserSession(device.id);
              setDevices((prev) => prev.filter((d) => d.id !== device.id));
              showToast('Session removed');
            })();
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
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
          <ThemedText style={styles.headerTitle}>Logged-In Devices</ThemedText>
          <View style={styles.headerBtnSpacer} />
        </View>

        <View style={styles.headerRule} />

        <ThemedText style={styles.lead}>
          Review devices where your account is signed in. Remove any session you do not recognize.
        </ThemedText>

        <View style={styles.list}>
          {devices.map((device, index) => (
            <Animated.View key={device.id} entering={FadeInDown.delay(index * 60).duration(280)}>
              <DeviceCard device={device} onRevoke={() => handleRevoke(device)} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <GuardianToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

function DeviceCard({
  device,
  onRevoke,
}: {
  device: LoggedInDevice;
  onRevoke: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, device.isCurrent && styles.iconWrapCurrent]}>
          <Ionicons
            name={device.platform.includes('Web') ? 'globe-outline' : 'phone-portrait-outline'}
            size={22}
            color={GuardianColors.primary}
          />
        </View>

        <View style={styles.meta}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.deviceName}>{device.name}</ThemedText>
            {device.isCurrent ? (
              <View style={styles.currentBadge}>
                <ThemedText style={styles.currentText}>This device</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.platform}>{device.platform}</ThemedText>
          <ThemedText style={styles.detail}>{device.location}</ThemedText>
          <ThemedText style={styles.detail}>{device.lastActive}</ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <Pressable accessibilityRole="button" onPress={onRevoke} style={styles.revokeBtn}>
        <Ionicons
          name={device.isCurrent ? 'log-out-outline' : 'close-circle-outline'}
          size={16}
          color={GuardianColors.danger}
        />
        <ThemedText style={styles.revokeText}>
          {device.isCurrent ? 'Sign out' : 'Remove session'}
        </ThemedText>
      </Pressable>
    </View>
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
  headerBtnSpacer: {
    width: 44,
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
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: GuardianColors.textSecondary,
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: GuardianColors.borderStrong,
    backgroundColor: GuardianColors.overlaySheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCurrent: {
    borderColor: '#BFDBFE',
    backgroundColor: GuardianColors.navyMuted,
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: GuardianColors.safeMuted,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentText: {
    fontSize: 11,
    fontWeight: '800',
    color: GuardianColors.safe,
  },
  platform: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  detail: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: GuardianColors.border,
    marginHorizontal: 16,
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 12,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: GuardianColors.dangerMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  revokeText: {
    fontSize: 14,
    fontWeight: '800',
    color: GuardianColors.danger,
  },
});

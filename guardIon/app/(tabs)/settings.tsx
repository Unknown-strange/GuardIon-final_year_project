import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuardianProfileCard } from '@/components/guardian/guardian-profile-card';
import { GuardianToast } from '@/components/guardian/guardian-toast';
import { SettingsMenuGroup } from '@/components/guardian/settings-menu-group';
import { SettingsMenuRow } from '@/components/guardian/settings-menu-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useGuardianProfilePhoto } from '@/hooks/use-guardian-profile-photo';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

const MANAGEMENT_ROWS = [
  {
    icon: 'people-outline' as const,
    label: 'Guardians',
    hint: 'Manage additional guardians and permissions',
    href: '/settings/guardians' as const,
  },
  {
    icon: 'happy-outline' as const,
    label: 'Children',
    hint: 'View and manage registered children profiles',
    href: '/settings/family-devices' as const,
  },
  {
    icon: 'call-outline' as const,
    iconVariant: 'danger' as const,
    label: 'Emergency Contacts',
    hint: 'Backup contacts for critical alerts',
    href: '/settings/emergency-contacts' as const,
  },
  {
    icon: 'notifications-outline' as const,
    label: 'Notifications',
    hint: 'Alerts, SOS, and weekly summaries',
    href: '/settings/notifications' as const,
  },
];

const ACCOUNT_ROWS = [
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Security Settings',
    hint: 'Change password and manage sessions',
    href: '/settings/privacy-data' as const,
  },
  {
    icon: 'help-circle-outline' as const,
    label: 'Help & Support',
    hint: 'Guides, FAQs, and contact us',
    href: '/settings/help-support' as const,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { photoUri, pickAndSavePhoto, removePhoto } = useGuardianProfilePhoto();
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const profile = {
    name: user?.name ?? 'Guardian',
    email: user?.email ?? '',
    role: 'Primary Guardian',
    initials: (user?.name ?? 'G')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  };

  const onEditPhoto = () => {
    Alert.alert('Profile photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose photo',
        onPress: async () => {
          const uri = await pickAndSavePhoto();
          if (uri) {
            setToastMessage('Profile photo updated');
            setToastVisible(true);
          }
        },
      },
      ...(photoUri
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: async () => {
                await removePhoto();
                setToastMessage('Profile photo removed');
                setToastVisible(true);
              },
            },
          ]
        : []),
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access GuardIon.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/authentication/signin' as any);
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
          <View style={styles.headerSide} />
          <ThemedText style={styles.headerTitle}>Account Profile</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            hitSlop={8}
            onPress={() => router.push('/settings/edit-profile' as any)}
            style={styles.editBtn}>
            <Ionicons name="create-outline" size={22} color={GuardianColors.text} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <GuardianProfileCard
            profile={profile}
            photoUri={photoUri}
            onEditPhoto={onEditPhoto}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(320)}>
          <SettingsMenuGroup title="Management">
            {MANAGEMENT_ROWS.map((row, index) => (
              <SettingsMenuRow
                key={row.label}
                icon={row.icon}
                iconVariant={'iconVariant' in row ? row.iconVariant : 'primary'}
                label={row.label}
                hint={row.hint}
                isLast={index === MANAGEMENT_ROWS.length - 1}
                onPress={() => router.push(row.href)}
              />
            ))}
          </SettingsMenuGroup>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(320)}>
          <SettingsMenuGroup title="Account Security">
            {ACCOUNT_ROWS.map((row, index) => (
              <SettingsMenuRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                hint={row.hint}
                isLast={index === ACCOUNT_ROWS.length - 1}
                onPress={() => router.push(row.href)}
              />
            ))}
          </SettingsMenuGroup>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(320)}>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={GuardianColors.danger} />
            <ThemedText style={styles.logoutText}>Log Out</ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>

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
    marginBottom: 8,
    minHeight: 44,
  },
  headerSide: {
    width: 44,
  },
  headerTitle: {
    ...Typography.title,
    color: GuardianColors.text,
    textAlign: 'center',
    flex: 1,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 16,
    shadowColor: GuardianColors.danger,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: GuardianColors.danger,
  },
});

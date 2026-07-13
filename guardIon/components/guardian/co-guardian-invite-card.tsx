import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { GuardianInviteResponse } from '@/api/guardians';
import { PrimaryButton, SecondaryButton } from '@/components/guardian/buttons';
import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Layout, Typography } from '@/constants/theme';

type Props = {
  invite: GuardianInviteResponse;
  onAccept: (guardianId: string) => Promise<void>;
  onDecline?: (guardianId: string) => Promise<void>;
};

export function CoGuardianInviteCard({ invite, onAccept, onDecline }: Props) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(invite.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setIsDeclining(true);
    try {
      await onDecline(invite.id);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={22} color={GuardianColors.primary} />
        </View>
        <View style={styles.body}>
          <ThemedText style={styles.badge}>Co-guardian invite</ThemedText>
          <ThemedText style={styles.title}>{invite.child_name}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {invite.invited_by_name} invited you to co-guard this child
          </ThemedText>
          <View style={styles.actions}>
            <PrimaryButton
              label={isAccepting ? 'Accepting…' : 'Accept invite'}
              onPress={handleAccept}
              disabled={isAccepting || isDeclining}
            />
            {onDecline ? (
              <SecondaryButton
                label={isDeclining ? 'Declining…' : 'Decline'}
                onPress={handleDecline}
                disabled={isAccepting || isDeclining}
              />
            ) : null}
          </View>
          {isAccepting ? (
            <ActivityIndicator size="small" color={GuardianColors.primary} style={styles.loader} />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: GuardianColors.surface,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: GuardianColors.primary,
    padding: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  badge: {
    ...Typography.caption,
    color: GuardianColors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: GuardianColors.text,
    marginTop: 4,
  },
  subtitle: {
    ...Typography.body,
    color: GuardianColors.textSecondary,
    marginTop: 6,
  },
  actions: {
    marginTop: 14,
    gap: 8,
  },
  loader: {
    marginTop: 8,
  },
});

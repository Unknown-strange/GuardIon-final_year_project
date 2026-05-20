import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors } from '@/constants/theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function SettingsMenuGroup({ title, children }: Props) {
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: GuardianColors.primary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: GuardianColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GuardianColors.border,
    overflow: 'hidden',
    shadowColor: GuardianColors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});

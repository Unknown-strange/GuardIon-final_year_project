import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors } from '@/constants/theme';

type PrimaryProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger';
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: PrimaryProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.primary,
        variant === 'danger' && styles.primaryDanger,
        inactive && styles.primaryDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.primaryText}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

type SecondaryProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SecondaryButton({ label, onPress, disabled }: SecondaryProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.secondary, disabled && styles.secondaryDisabled]}>
      <ThemedText style={styles.secondaryText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 52,
    borderRadius: 26,
    backgroundColor: GuardianColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryDanger: {
    backgroundColor: GuardianColors.danger,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    height: 52,
    borderRadius: 26,
    backgroundColor: GuardianColors.overlaySheet,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  secondaryDisabled: { opacity: 0.45 },
  secondaryText: {
    color: GuardianColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

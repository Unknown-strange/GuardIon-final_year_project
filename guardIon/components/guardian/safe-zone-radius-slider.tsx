import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';
import {
  SAFE_ZONE_RADIUS_MAX,
  SAFE_ZONE_RADIUS_MIN,
} from '@/types/safe-zone';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function SafeZoneRadiusSlider({
  value,
  onChange,
  min = SAFE_ZONE_RADIUS_MIN,
  max = SAFE_ZONE_RADIUS_MAX,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ThemedText style={styles.label}>Detection Radius</ThemedText>
        <View style={styles.pill}>
          <ThemedText style={styles.pillText}>{Math.round(value)} meters</ThemedText>
        </View>
      </View>
      <View style={styles.sliderRow}>
        <ThemedText style={styles.edge}>50M</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={10}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={GuardianColors.safe}
          maximumTrackTintColor={GuardianColors.navyMuted}
          thumbTintColor={GuardianColors.primary}
        />
        <ThemedText style={styles.edge}>1KM</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pill: {
    backgroundColor: GuardianColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  edge: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    fontWeight: '700',
    minWidth: 32,
  },
});

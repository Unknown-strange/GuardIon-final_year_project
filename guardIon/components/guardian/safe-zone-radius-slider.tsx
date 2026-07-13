import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GuardianColors, Typography } from '@/constants/theme';
import {
  SAFE_ZONE_RADIUS_MAX,
  SAFE_ZONE_RADIUS_MIN,
} from '@/types/safe-zone';

const RADIUS_STEP = 5;

type Props = {
  value: number;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  min?: number;
  max?: number;
};

export function SafeZoneRadiusSlider({
  value,
  onChange,
  onChangeComplete,
  min = SAFE_ZONE_RADIUS_MIN,
  max = SAFE_ZONE_RADIUS_MAX,
}: Props) {
  const rounded = Math.round(value);
  const atMin = rounded <= min;
  const atMax = rounded >= max;

  const adjustRadius = useCallback(
    (delta: number) => {
      const next = Math.min(max, Math.max(min, rounded + delta));
      onChange(next);
      onChangeComplete?.(next);
    },
    [max, min, onChange, onChangeComplete, rounded],
  );

  const minLabel = min < 1000 ? `${min}M` : '1KM';
  const maxLabel = max >= 1000 ? '1KM' : `${max}M`;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ThemedText style={styles.label}>Detection Radius</ThemedText>
        <View style={styles.radiusControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease radius"
            disabled={atMin}
            onPress={() => adjustRadius(-RADIUS_STEP)}
            style={[styles.stepBtn, atMin && styles.stepBtnDisabled]}>
            <Ionicons
              name="remove"
              size={20}
              color={atMin ? GuardianColors.textMuted : GuardianColors.primary}
            />
          </Pressable>
          <View style={styles.pill}>
            <ThemedText style={styles.pillText}>{rounded} meters</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase radius"
            disabled={atMax}
            onPress={() => adjustRadius(RADIUS_STEP)}
            style={[styles.stepBtn, atMax && styles.stepBtnDisabled]}>
            <Ionicons
              name="add"
              size={20}
              color={atMax ? GuardianColors.textMuted : GuardianColors.primary}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.sliderRow}>
        <ThemedText style={styles.edge}>{minLabel}</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={1}
          value={value}
          onValueChange={onChange}
          onSlidingComplete={(v) => {
            onChange(v);
            onChangeComplete?.(v);
          }}
          minimumTrackTintColor={GuardianColors.safe}
          maximumTrackTintColor={GuardianColors.navyMuted}
          thumbTintColor={GuardianColors.primary}
        />
        <ThemedText style={styles.edge}>{maxLabel}</ThemedText>
      </View>
      <ThemedText style={styles.hint}>
        Use +/− or drag the slider to resize the circle on the map. GPS drift is ~10m, so very tight
        zones may alert more often.
      </ThemedText>
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
    gap: 8,
  },
  label: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  radiusControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GuardianColors.primary,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.overlaySheet,
  },
  pill: {
    backgroundColor: GuardianColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 96,
    alignItems: 'center',
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
  hint: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    lineHeight: 16,
  },
});

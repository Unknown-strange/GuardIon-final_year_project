import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

type Props = {
  visible: boolean;
  message: string;
  durationMs?: number;
  onHide: () => void;
};

export function GuardianToast({ visible, message, durationMs = 2500, onHide }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.toast}>
        <ThemedText style={styles.text}>{message}</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
    zIndex: 100,
  },
  toast: {
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    maxWidth: '88%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

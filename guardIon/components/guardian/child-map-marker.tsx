import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { getChildColorTheme } from '@/constants/child-colors';

type Props = {
  childId: string;
  name: string;
  latitude: number;
  longitude: number;
  selected?: boolean;
  onPress?: () => void;
};

export function ChildMapMarker({
  childId,
  name,
  latitude,
  longitude,
  selected = false,
  onPress,
}: Props) {
  const colors = getChildColorTheme(childId);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={name}
      anchor={{ x: 0.5, y: 1 }}
      onPress={onPress}
      tracksViewChanges={false}>
      <View style={styles.wrap}>
        <View
          style={[
            styles.bubble,
            { borderColor: colors.border },
            selected && styles.bubbleSelected,
          ]}>
          <ChildAvatar
            childId={childId}
            size={selected ? 38 : 32}
            borderWidth={2}
            borderColor={colors.main}
          />
        </View>
        <View style={[styles.tail, { borderTopColor: colors.main }]} />
        {selected ? (
          <View style={[styles.ring, { borderColor: colors.main }]} />
        ) : null}
      </View>
    </Marker>
  );
}

type ChildLocationDotProps = {
  latitude: number;
  longitude: number;
  color: string;
};

export function ChildLocationDot({ latitude, longitude, color }: ChildLocationDotProps) {
  return (
    <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={[styles.dotOuter, { borderColor: color }]}>
        <View style={[styles.dotInner, { backgroundColor: color }]} />
      </View>
    </Marker>
  );
}

type MapCenterPinProps = {
  color: string;
};

export function MapCenterPinOverlay({ color }: MapCenterPinProps) {
  return (
    <View style={styles.centerOverlay} pointerEvents="none">
      <View style={[styles.centerRing, { borderColor: color }]} />
      <Ionicons name="location" size={34} color={color} style={styles.centerIcon} />
      <View style={[styles.centerShadow, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bubbleSelected: {
    transform: [{ scale: 1.08 }],
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  ring: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    opacity: 0.35,
    top: -6,
  },
  dotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    opacity: 0.25,
    top: '50%',
    marginTop: -40,
  },
  centerIcon: {
    marginTop: -28,
  },
  centerShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.35,
    marginTop: -6,
  },
});

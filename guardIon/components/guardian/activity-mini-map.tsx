import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { GuardianColors } from '@/constants/theme';

type Props = {
  latitude: number;
  longitude: number;
  size?: number;
  width?: number | '100%';
  height?: number;
};

export function ActivityMiniMap({
  latitude,
  longitude,
  size = 72,
  width,
  height,
}: Props) {
  const mapWidth = width ?? size;
  const mapHeight = height ?? size;

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: mapWidth,
            height: mapHeight,
            backgroundColor: GuardianColors.navyMuted,
          },
        ]}
      />
    );
  }

  return (
    <View style={[styles.wrap, { width: mapWidth, height: mapHeight }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none">
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    backgroundColor: GuardianColors.navyMuted,
  },
  fallback: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
});

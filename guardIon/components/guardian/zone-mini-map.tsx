import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors } from '@/constants/theme';
import { mapDeltaForZoneRadius, zoneColors, type SafeZone } from '@/types/safe-zone';

type Props = {
  zone: Pick<SafeZone, 'childId' | 'latitude' | 'longitude' | 'radiusM' | 'zoneType'>;
  height?: number;
};

export function ZoneMiniMap({ zone, height = 140 }: Props) {
  const childColors = getChildColorTheme(zone.childId);
  const zoneStyle = zoneColors(zone.zoneType ?? 'safe');

  if (Platform.OS === 'web') {
    return <View style={[styles.fallback, { height, backgroundColor: childColors.muted }]} />;
  }

  const delta = mapDeltaForZoneRadius(zone.radiusM);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: zone.latitude,
          longitude: zone.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none">
        <Circle
          center={{ latitude: zone.latitude, longitude: zone.longitude }}
          radius={zone.radiusM}
          strokeColor={zoneStyle.stroke}
          fillColor={zoneStyle.fill}
          strokeWidth={2}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: GuardianColors.navyMuted,
    overflow: 'hidden',
  },
  fallback: {
    width: '100%',
  },
});

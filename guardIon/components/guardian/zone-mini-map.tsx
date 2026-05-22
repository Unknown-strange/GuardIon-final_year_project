import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors } from '@/constants/theme';
import { mapDeltaForZoneRadius, type SafeZone } from '@/types/safe-zone';

type Props = {
  zone: Pick<SafeZone, 'childId' | 'latitude' | 'longitude' | 'radiusM'>;
  height?: number;
};

export function ZoneMiniMap({ zone, height = 140 }: Props) {
  const colors = getChildColorTheme(zone.childId);

  if (Platform.OS === 'web') {
    return <View style={[styles.fallback, { height, backgroundColor: colors.muted }]} />;
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
          strokeColor={colors.main}
          fillColor={colors.fill}
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

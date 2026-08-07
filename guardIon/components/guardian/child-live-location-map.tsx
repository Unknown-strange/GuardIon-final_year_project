import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';

import { ChildMapMarker } from '@/components/guardian/child-map-marker';
import { ThemedText } from '@/components/themed-text';
import type { ChildSummary } from '@/components/guardian/child-summary-card';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';
import type { SafeZone } from '@/types/safe-zone';
import { zoneColors } from '@/types/safe-zone';

type Props = {
  child: ChildSummary;
  zones?: SafeZone[];
  onPress?: () => void;
  height?: number;
};

export function ChildLiveLocationMap({
  child,
  zones = [],
  onPress,
  height = 180,
}: Props) {
  const colors = getChildColorTheme(child.id);
  const mapRef = useRef<MapView>(null);

  const recenter = useCallback(() => {
    mapRef.current?.animateToRegion(
      {
        latitude: child.latitude,
        longitude: child.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      350,
    );
  }, [child.latitude, child.longitude]);

  if (Platform.OS === 'web') {
    return (
      <Pressable onPress={onPress} style={[styles.webWrap, { height }]}>
        <Image
          source={require('@/assets/mockups/child-details-dashboard.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.webBanner}>
          <ThemedText style={styles.webText}>Live map on iOS & Android</ThemedText>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: child.latitude,
          longitude: child.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}>
        {zones.map((zone) => {
          const style = zoneColors(zone.zoneType ?? 'safe');
          return (
            <Circle
              key={zone.id}
              center={{ latitude: zone.latitude, longitude: zone.longitude }}
              radius={zone.radiusM}
              strokeColor={style.stroke}
              fillColor={style.fill}
              strokeWidth={2}
            />
          );
        })}
        <ChildMapMarker
          childId={child.id}
          name={child.name}
          latitude={child.latitude}
          longitude={child.longitude}
          selected
        />
      </MapView>

      {onPress ? (
        <Pressable style={styles.openBtn} onPress={onPress}>
          <ThemedText style={styles.openBtnText}>Open on map</ThemedText>
          <Ionicons name="arrow-forward" size={14} color={colors.main} />
        </Pressable>
      ) : null}

      <Pressable style={styles.locateBtn} onPress={recenter}>
        <Ionicons name="locate" size={16} color={colors.main} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: GuardianColors.navyMuted,
  },
  webWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: GuardianColors.navyMuted,
  },
  webBanner: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 8,
    borderRadius: 10,
  },
  webText: {
    ...Typography.caption,
    textAlign: 'center',
    color: GuardianColors.textSecondary,
    fontWeight: '600',
  },
  openBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
  openBtnText: {
    fontWeight: '800',
    fontSize: 12,
    color: GuardianColors.primary,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    zIndex: 10,
    elevation: 10,
  },
});

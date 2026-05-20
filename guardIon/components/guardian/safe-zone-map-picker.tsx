import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { ChildAvatar } from '@/components/guardian/child-avatar';
import { ThemedText } from '@/components/themed-text';
import { getChildColorTheme } from '@/constants/child-colors';
import { GuardianColors, Typography } from '@/constants/theme';

type LatLng = { latitude: number; longitude: number };

type Props = {
  childId: string;
  childName: string;
  childLocation: string;
  childPosition: LatLng;
  radius: number;
};

function ChildZoneMarker({ childId, color }: { childId: string; color: string }) {
  return (
    <View style={styles.childMarker}>
      <ChildAvatar childId={childId} size={38} borderWidth={2} borderColor={color} />
      <View style={[styles.childTail, { borderTopColor: color }]} />
    </View>
  );
}

export function SafeZoneMapPicker({
  childId,
  childName,
  childLocation,
  childPosition,
  radius,
}: Props) {
  const colors = getChildColorTheme(childId);
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    ...childPosition,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const recenterOnChild = useCallback(() => {
    mapRef.current?.animateToRegion(
      {
        ...childPosition,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      400,
    );
  }, [childPosition]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <ThemedText style={styles.webText}>
          Live map preview is available on iOS and Android builds.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}>
        <Circle
          center={childPosition}
          radius={radius}
          strokeColor={colors.main}
          fillColor={colors.fill}
          strokeWidth={2}
        />
        <Marker
          coordinate={childPosition}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}>
          <ChildZoneMarker childId={childId} color={colors.main} />
        </Marker>
      </MapView>

      <View style={styles.hint} pointerEvents="none">
        <Ionicons name="move-outline" size={14} color={GuardianColors.textSecondary} />
        <ThemedText style={styles.hintText}>
          Pan & zoom to view the zone around {childName}
        </ThemedText>
      </View>

      <View style={styles.badge} pointerEvents="none">
        <Ionicons name="location" size={14} color={colors.main} />
        <ThemedText style={styles.badgeText}>{childLocation}</ThemedText>
      </View>

      <Pressable style={styles.recenterBtn} onPress={recenterOnChild}>
        <Ionicons name="locate" size={18} color={colors.main} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 280,
    borderRadius: 16,
    backgroundColor: GuardianColors.navyMuted,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  childMarker: {
    alignItems: 'center',
  },
  childTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  hint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 60,
    elevation: 60,
  },
  hintText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '78%',
    zIndex: 60,
    elevation: 60,
  },
  badgeText: {
    fontWeight: '700',
    color: GuardianColors.text,
    fontSize: 12,
    flexShrink: 1,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
    zIndex: 60,
    elevation: 60,
  },
  webFallback: {
    height: 200,
    borderRadius: 16,
    backgroundColor: GuardianColors.navyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  webText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChildMapMarker } from '@/components/guardian/child-map-marker';
import { MapChildSelector } from '@/components/guardian/map-child-selector';
import { ScreenHeader } from '@/components/guardian/screen-header';
import { StatusBadge } from '@/components/guardian/status-badge';
import { ThemedText } from '@/components/themed-text';
import { getChildColorTheme } from '@/constants/child-colors';
import { useGuardianData } from '@/contexts/guardian-data-context';
import { GuardianColors, Layout, Typography } from '@/constants/theme';
import { useSafeZones } from '@/hooks/use-safe-zones';
import { childGeofenceStatus } from '@/types/safe-zone';

const DEMO_CENTER = { latitude: 5.6037, longitude: -0.187 };
const INITIAL_DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };
const CHILD_ZOOM_DELTA = { latitudeDelta: 0.035, longitudeDelta: 0.035 };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function regionForChild(latitude: number, longitude: number) {
  return {
    latitude,
    longitude,
    ...CHILD_ZOOM_DELTA,
  };
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{ childId?: string }>();
  const { children, getChildById } = useGuardianData();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const { childZones, refresh } = useSafeZones(selectedChildId);

  const selectedChild = useMemo(
    () => (selectedChildId ? getChildById(selectedChildId) ?? null : null),
    [getChildById, selectedChildId],
  );

  const selectedColors = useMemo(
    () => (selectedChildId ? getChildColorTheme(selectedChildId) : null),
    [selectedChildId],
  );

  const geofenceStatus = useMemo(() => {
    if (!selectedChild) return 'none' as const;
    return childGeofenceStatus(selectedChild.latitude, selectedChild.longitude, childZones);
  }, [childZones, selectedChild]);

  const focusChild = useCallback((childId: string) => {
    const child = getChildById(childId);
    if (!child) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedChildId(childId);
    mapRef.current?.animateToRegion(regionForChild(child.latitude, child.longitude), 500);
  }, [getChildById]);

  const clearSelection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedChildId(null);
    mapRef.current?.animateToRegion(
      {
        ...DEMO_CENTER,
        ...INITIAL_DELTA,
      },
      450,
    );
  }, []);

  useEffect(() => {
    if (params.childId && typeof params.childId === 'string') {
      focusChild(params.childId);
    }
  }, [focusChild, params.childId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onLocatePress = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        450,
      );
    } finally {
      setLocating(false);
    }
  }, []);

  const showNativeMap = Platform.OS !== 'web';

  return (
    <View style={styles.root}>
      {showNativeMap ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            ...DEMO_CENTER,
            ...INITIAL_DELTA,
          }}
          showsUserLocation
          showsMyLocationButton={false}>
          {children.map((child) => (
            <ChildMapMarker
              key={child.id}
              childId={child.id}
              name={child.name}
              latitude={child.latitude}
              longitude={child.longitude}
              selected={child.id === selectedChildId}
              onPress={() => focusChild(child.id)}
            />
          ))}
          {selectedChildId && selectedColors
            ? childZones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={{ latitude: zone.latitude, longitude: zone.longitude }}
                  radius={zone.radiusM}
                  strokeColor={selectedColors.main}
                  fillColor={selectedColors.fill}
                  strokeWidth={2}
                />
              ))
            : null}
        </MapView>
      ) : (
        <>
          <Image
            source={require('@/assets/mockups/map-dashboard.png')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[styles.darken, StyleSheet.absoluteFill]} />
          <View style={styles.webBanner}>
            <ThemedText style={styles.webBannerText}>
              Live Google Maps runs on iOS and Android. Use a device build or emulator to preview the map.
            </ThemedText>
          </View>
        </>
      )}

      {!showNativeMap ? null : (
        <View style={[styles.darkenLight, StyleSheet.absoluteFill]} pointerEvents="none" />
      )}

      <View style={[styles.topSafe, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader />
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={GuardianColors.textMuted} />
          <TextInput
            placeholder="Search address or zone..."
            placeholderTextColor={GuardianColors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={[styles.controlsRight, { bottom: selectedChild ? 320 : 260 }]}>
        <Pressable style={styles.roundBtn} onPress={onLocatePress} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={GuardianColors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={GuardianColors.primary} />
          )}
        </Pressable>
        <Pressable style={styles.roundBtn}>
          <Ionicons name="layers-outline" size={20} color={GuardianColors.primary} />
        </Pressable>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        {selectedChild ? (
          <View style={styles.selectedPanel}>
            <View style={styles.selectedHeader}>
              <Pressable accessibilityRole="button" onPress={clearSelection} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={GuardianColors.primary} />
              </Pressable>
              <View style={styles.selectedMeta}>
                <ThemedText style={styles.selectedName}>{selectedChild.name}</ThemedText>
                <ThemedText style={styles.selectedLoc} numberOfLines={1}>
                  {selectedChild.location}
                </ThemedText>
              </View>
              <StatusBadge variant={selectedChild.status} />
            </View>

            <Pressable
              style={[styles.zoneBtn, selectedColors && { backgroundColor: selectedColors.muted }]}
              onPress={() =>
                router.push({
                  pathname: '/add-safe-zone',
                  params: { childId: selectedChild.id },
                } as any)
              }>
              <Ionicons name="add-circle-outline" size={20} color={selectedColors?.main ?? GuardianColors.safe} />
              <ThemedText style={[styles.zoneSafeText, { color: selectedColors?.main ?? GuardianColors.safe }]}>
                Safe Zone
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.manageRow}
              onPress={() =>
                router.push({
                  pathname: '/map/manage-zones',
                  params: { childId: selectedChild.id },
                } as any)
              }>
              <Ionicons name="create-outline" size={22} color={GuardianColors.textSecondary} />
              <ThemedText style={styles.manageText}>Manage All Zones</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={GuardianColors.textMuted} />
            </Pressable>

            <View style={styles.statusBlock}>
              <View>
                <ThemedText style={styles.statusLabel}>CURRENT STATUS</ThemedText>
                <View style={styles.statusLine}>
                  <View
                    style={[
                      styles.statusDot,
                      geofenceStatus === 'inside'
                        ? styles.statusDotSafe
                        : geofenceStatus === 'outside'
                          ? styles.statusDotDanger
                          : styles.statusDotMuted,
                    ]}
                  />
                  <ThemedText
                    style={[
                      styles.statusStrong,
                      geofenceStatus === 'inside'
                        ? styles.statusSafeText
                        : geofenceStatus === 'outside'
                          ? styles.statusDangerText
                          : styles.statusMutedText,
                    ]}>
                    {geofenceStatus === 'inside'
                      ? 'INSIDE SAFE ZONE'
                      : geofenceStatus === 'outside'
                        ? 'OUTSIDE SAFE ZONE'
                        : 'NO ZONES SET'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.updated}>Last updated {selectedChild.lastUpdate}</ThemedText>
            </View>
          </View>
        ) : (
          <MapChildSelector
            items={children}
            selectedChildId={selectedChildId}
            onSelect={focusChild}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GuardianColors.primaryDark,
  },
  darken: {
    backgroundColor: 'rgba(0,40,50,0.12)',
  },
  darkenLight: {
    backgroundColor: 'rgba(248,250,252,0.06)',
  },
  webBanner: {
    position: 'absolute',
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    top: '38%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  webBannerText: {
    ...Typography.caption,
    color: GuardianColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  topSafe: {
    paddingHorizontal: Layout.screenPadding,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GuardianColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: GuardianColors.text,
    padding: 0,
  },
  controlsRight: {
    position: 'absolute',
    right: Layout.screenPadding,
    gap: 10,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GuardianColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GuardianColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  selectedPanel: {
    gap: 14,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GuardianColors.overlaySheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMeta: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '900',
    color: GuardianColors.text,
  },
  selectedLoc: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
  },
  zoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  zoneSafe: {
    backgroundColor: GuardianColors.safeMuted,
  },
  zoneSafeText: {
    fontWeight: '800',
    color: GuardianColors.safe,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GuardianColors.overlaySheet,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GuardianColors.border,
  },
  manageText: {
    flex: 1,
    fontWeight: '700',
    color: GuardianColors.text,
    fontSize: 15,
  },
  statusBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusLabel: {
    ...Typography.label,
    color: GuardianColors.textMuted,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSafe: {
    backgroundColor: GuardianColors.safe,
  },
  statusDotDanger: {
    backgroundColor: GuardianColors.danger,
  },
  statusDotMuted: {
    backgroundColor: GuardianColors.textMuted,
  },
  statusStrong: {
    fontWeight: '900',
    fontSize: 14,
  },
  statusSafeText: {
    color: GuardianColors.safe,
  },
  statusDangerText: {
    color: GuardianColors.danger,
  },
  statusMutedText: {
    color: GuardianColors.textMuted,
  },
  updated: {
    ...Typography.caption,
    color: GuardianColors.textMuted,
    maxWidth: '44%',
    textAlign: 'right',
  },
});

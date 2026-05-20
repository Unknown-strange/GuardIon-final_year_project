/**
 * Dynamic Expo config — merges app.json and injects native Google Maps API keys.
 *
 * Keys: create `.env` in this folder (see `.env.example`). Rebuild native apps after changing keys:
 *   npx expo prebuild --clean
 *   npx expo run:android   # or run:ios
 *
 * Expo SDK wires Maps via android.config.googleMaps.apiKey and ios.config.googleMapsApiKey
 * (see https://docs.expo.dev/versions/latest/sdk/map-view/).
 */
module.exports = ({ config }) => {
  const androidKey =
    process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? '';
  const iosKey =
    process.env.GOOGLE_MAPS_IOS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? '';

  return {
    ...config,
    owner: config.owner ?? 'tekmart-boys',
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
      googleRedirectUri:
        process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ??
        'https://auth.expo.io/@tekmart-boys/guardIon',
      expoProjectFullName:
        process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME ?? '@tekmart-boys/guardIon',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.guardion.app',
      config: {
        ...config.ios?.config,
        googleMapsApiKey: iosKey,
      },
    },
    android: {
      ...config.android,
      package: config.android?.package ?? 'com.guardion.app',
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: androidKey,
        },
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      '@react-native-community/datetimepicker',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'GuardIon uses your location to center the map near you.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'GuardIon accesses your photos so you can set a child profile picture.',
        },
      ],
    ],
  };
};

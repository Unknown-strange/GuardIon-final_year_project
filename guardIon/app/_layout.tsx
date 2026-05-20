import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { GuardianDataProvider } from '@/contexts/guardian-data-context';
import { GuardianProfilePhotoProvider } from '@/contexts/guardian-profile-photo-context';
import { GuardianColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'splash-screen',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
      <GuardianProfilePhotoProvider>
      <GuardianDataProvider>
      <Stack initialRouteName="splash-screen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash-screen" />
        <Stack.Screen name="authentication" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="child" />
        <Stack.Screen
          name="map/manage-zones"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: GuardianColors.background },
          }}
        />
        <Stack.Screen
          name="add-safe-zone"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: GuardianColors.background },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      </GuardianDataProvider>
      </GuardianProfilePhotoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

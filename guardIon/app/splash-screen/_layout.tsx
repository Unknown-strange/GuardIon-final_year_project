import { Stack } from 'expo-router';

export default function SplashScreenLayout() {
  return (
    <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding-one" />
      <Stack.Screen name="onboarding-two" />
      <Stack.Screen name="onboarding-three" />
    </Stack>
  );
}

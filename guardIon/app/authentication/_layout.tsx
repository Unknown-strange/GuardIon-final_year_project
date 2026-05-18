import { Stack } from 'expo-router';

export default function AuthenticationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}

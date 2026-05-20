import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, getErrorMessage } from '@/contexts/auth-context';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';

type GoogleSignInButtonProps = {
  onSuccess: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GoogleSignInButton({ onSuccess, disabled, style }: GoogleSignInButtonProps) {
  const { signInWithGoogle, signInWithGoogleCode } = useAuth();
  const { promptGoogleSignIn, isConfigured, isReady } = useGoogleSignIn();
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Google Sign-In not configured',
        'Add your Google OAuth client IDs to guardIon/.env, then restart Expo.',
      );
      return;
    }

    setLoading(true);
    try {
      const result = await promptGoogleSignIn();
      if (result.type === 'code') {
        await signInWithGoogleCode({
          code: result.code,
          redirectUri: result.redirectUri,
          codeVerifier: result.codeVerifier,
        });
      } else {
        await signInWithGoogle(result.idToken);
      }
      onSuccess();
    } catch (error) {
      const message = getErrorMessage(error, 'Google sign-in failed.');
      if (!message.toLowerCase().includes('cancel')) {
        Alert.alert('Google sign-in failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
      disabled={disabled || loading || !isReady}
      onPress={onPress}
      style={[styles.button, style, (disabled || loading || !isReady) && styles.disabled]}>
      {loading ? (
        <ActivityIndicator color="#111827" />
      ) : (
        <Ionicons name="logo-google" size={22} color="#111827" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabled: {
    opacity: 0.6,
  },
});

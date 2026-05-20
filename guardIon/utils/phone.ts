import { Alert, Linking, Platform } from 'react-native';

export function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.startsWith('233') && digits.length >= 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  return trimmed;
}

export async function callPhone(phone: string, label?: string): Promise<boolean> {
  if (!phone.trim()) return false;

  const url = `tel:${phone.replace(/\s/g, '')}`;

  if (Platform.OS === 'web') {
    Alert.alert('Calling unavailable', 'Phone calls work on a physical iOS or Android device.');
    return false;
  }

  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert('Cannot call', label ? `Unable to call ${label}.` : 'Unable to open the phone dialer.');
    return false;
  }

  await Linking.openURL(url);
  return true;
}

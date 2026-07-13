import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const ALARM_SOUND_URI =
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749bf28.mp3';

let audioReady = false;
let androidChannelReady = false;

async function ensureAudioReady() {
  if (audioReady) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioReady = true;
}

async function ensureAndroidAlertChannel() {
  if (Platform.OS !== 'android' || androidChannelReady) return;
  await Notifications.setNotificationChannelAsync('safety-alerts', {
    name: 'Safety Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 300, 200, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
  androidChannelReady = true;
}

async function playAlarmTone() {
  try {
    await ensureAudioReady();
    const { sound } = await Audio.Sound.createAsync(
      { uri: ALARM_SOUND_URI },
      { shouldPlay: true, volume: 1.0, isLooping: false },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    /* notification fallback below */
  }
}

function normalizeAlertType(alertType: string) {
  return alertType.trim().toUpperCase().replace(/-/g, '_');
}

function alertSpeechMessage(
  alertType: string,
  childName: string,
  zoneName?: string | null,
) {
  const type = normalizeAlertType(alertType);
  if (type === 'SOS') {
    return `${childName} pressed the panic button. Emergency SOS alert.`;
  }
  if (type === 'GEOFENCE_BREACH') {
    const zone = zoneName?.trim() || 'safe zone';
    return `${childName} has left safe zone ${zone}`;
  }
  if (type === 'CHILD_MISSING') {
    return `${childName} has been reported missing. Check the alert immediately.`;
  }
  return `${childName} safety alert`;
}

function alertNotificationTitle(alertType: string) {
  const type = normalizeAlertType(alertType);
  if (type === 'SOS') return 'Emergency SOS';
  if (type === 'GEOFENCE_BREACH') return 'Safe zone alert';
  if (type === 'CHILD_MISSING') return 'Missing child alert';
  return 'GuardIon alert';
}

async function ensureNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function announceLiveAlert(
  alertType: string,
  childName: string,
  zoneName?: string | null,
) {
  const message = alertSpeechMessage(alertType, childName, zoneName);
  const title = alertNotificationTitle(alertType);

  await ensureAndroidAlertChannel();

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* optional */
  }

  const permitted = await ensureNotificationPermission();
  if (permitted) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' ? { channelId: 'safety-alerts' } : {}),
        },
        trigger: null,
      });
    } catch {
      /* fall through to audio / speech */
    }
  }

  await playAlarmTone();

  Speech.stop();
  Speech.speak(message, {
    language: 'en',
    rate: 0.92,
    pitch: 1,
    volume: 1,
  });
}

/** @deprecated use announceLiveAlert */
export function speakGeofenceExit(childName: string, zoneName?: string | null) {
  void announceLiveAlert('geofence_breach', childName, zoneName);
}

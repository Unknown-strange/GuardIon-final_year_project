import { Audio } from 'expo-av';

import * as Haptics from 'expo-haptics';

import * as Notifications from 'expo-notifications';

import * as Speech from 'expo-speech';

import { Platform } from 'react-native';



const ZONE_ALERT_SOUND = require('@/assets/sound/beep-beep.mp3');

const ZONE_ALERT_SOUND_NAME = 'beep-beep.mp3';

const ZONE_ALERT_ANDROID_SOUND = 'beep-beep';

const SAFETY_ALERTS_CHANNEL_ID = 'safety-alerts';



const SAFE_ARRIVAL_SOUND = require('@/assets/sound/mixkit-happy-bell-alert-601.wav');

const SAFE_ARRIVAL_SOUND_NAME = 'mixkit-happy-bell-alert-601.wav';

const SAFE_ARRIVAL_ANDROID_SOUND = 'mixkit-happy-bell-alert-601';

const SAFE_ARRIVALS_CHANNEL_ID = 'safe-arrivals';



const DANGER_ALERT_SOUND = require('@/assets/sound/mixkit-system-beep-buzzer-fail-2964.wav');

const DANGER_ALERT_SOUND_NAME = 'mixkit-system-beep-buzzer-fail-2964.wav';

const DANGER_ALERT_ANDROID_SOUND = 'mixkit-system-beep-buzzer-fail-2964';

const CRITICAL_ALERTS_CHANNEL_ID = 'critical-alerts';



const ALARM_SOUND_URI =

  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749bf28.mp3';



let audioReady = false;

let androidZoneChannelReady = false;

let androidSafeArrivalChannelReady = false;

let androidCriticalChannelReady = false;



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



async function ensureAndroidZoneAlertChannel() {

  if (Platform.OS !== 'android' || androidZoneChannelReady) return;

  await Notifications.setNotificationChannelAsync(SAFETY_ALERTS_CHANNEL_ID, {

    name: 'Zone Alerts',

    importance: Notifications.AndroidImportance.MAX,

    sound: ZONE_ALERT_ANDROID_SOUND,

    vibrationPattern: [0, 300, 200, 300],

    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,

    bypassDnd: true,

  });

  androidZoneChannelReady = true;

}



async function ensureAndroidSafeArrivalChannel() {

  if (Platform.OS !== 'android' || androidSafeArrivalChannelReady) return;

  await Notifications.setNotificationChannelAsync(SAFE_ARRIVALS_CHANNEL_ID, {

    name: 'Safe Zone Arrivals',

    importance: Notifications.AndroidImportance.HIGH,

    sound: SAFE_ARRIVAL_ANDROID_SOUND,

    vibrationPattern: [0, 180],

    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,

  });

  androidSafeArrivalChannelReady = true;

}



async function ensureAndroidCriticalAlertChannel() {

  if (Platform.OS !== 'android' || androidCriticalChannelReady) return;

  await Notifications.setNotificationChannelAsync(CRITICAL_ALERTS_CHANNEL_ID, {

    name: 'Critical Safety Alerts',

    importance: Notifications.AndroidImportance.MAX,

    sound: DANGER_ALERT_ANDROID_SOUND,

    vibrationPattern: [0, 400, 200, 400],

    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,

    bypassDnd: true,

  });

  androidCriticalChannelReady = true;

}



async function playBundledTone(source: number) {

  try {

    await ensureAudioReady();

    const { sound } = await Audio.Sound.createAsync(

      source,

      { shouldPlay: true, volume: 1.0, isLooping: false },

    );

    sound.setOnPlaybackStatusUpdate((status) => {

      if (status.isLoaded && status.didJustFinish) {

        void sound.unloadAsync();

      }

    });

  } catch {

    /* local notification may still play */

  }

}



async function playZoneAlertTone() {

  await playBundledTone(ZONE_ALERT_SOUND);

}



async function playSafeArrivalTone() {

  await playBundledTone(SAFE_ARRIVAL_SOUND);

}



async function playDangerAlertTone() {

  await playBundledTone(DANGER_ALERT_SOUND);

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



function isCriticalAlertType(alertType: string) {

  const type = normalizeAlertType(alertType);

  return (

    type === 'SOS' ||

    type === 'GEOFENCE_BREACH' ||

    type === 'DANGER_ZONE_ENTRY'

  );

}



function isBeepOnlyAlertType(alertType: string) {

  const type = normalizeAlertType(alertType);

  return type === 'SOS' || type === 'CHECK_IN_SAFE';

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

  if (type === 'DANGER_ZONE_ENTRY') {

    const zone = zoneName?.trim() || 'danger zone';

    return `${childName} has entered danger zone ${zone}`;

  }

  if (type === 'SAFE_ZONE_ENTRY') {

    const zone = zoneName?.trim() || 'safe zone';

    return `${childName} has arrived at safe zone ${zone}`;

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

  if (type === 'DANGER_ZONE_ENTRY') return 'Danger zone alert';

  if (type === 'SAFE_ZONE_ENTRY') return 'Safe zone arrival';

  if (type === 'CHILD_MISSING') return 'Missing child alert';

  return 'GuardIon alert';

}



async function ensureNotificationPermission() {

  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted';

}



/** Register Android channels up front so background pushes use the right sound. */

export async function ensureAlertNotificationChannels() {

  await ensureAndroidZoneAlertChannel();

  await ensureAndroidSafeArrivalChannel();

  await ensureAndroidCriticalAlertChannel();

}



/** Beep + notification only — no text-to-speech. */

export async function announceBundledBeepAlert(title: string, body: string) {

  await ensureAndroidZoneAlertChannel();



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

          body,

          sound: ZONE_ALERT_SOUND_NAME,

          priority: Notifications.AndroidNotificationPriority.MAX,

          ...(Platform.OS === 'android'

            ? { channelId: SAFETY_ALERTS_CHANNEL_ID }

            : {}),

        },

        trigger: null,

      });

    } catch {

      /* fall through to in-app tone */

    }

  }



  await playZoneAlertTone();

}



/** Happy bell + notification when a child arrives in a safe zone — no text-to-speech. */

export async function announceSafeZoneEntry(

  childName: string,

  zoneName?: string | null,

) {

  await ensureAndroidSafeArrivalChannel();



  const zone = zoneName?.trim() || 'safe zone';



  try {

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  } catch {

    /* optional */

  }



  const permitted = await ensureNotificationPermission();

  if (permitted) {

    try {

      await Notifications.scheduleNotificationAsync({

        content: {

          title: 'Safe zone arrival',

          body: `${childName} arrived at ${zone}`,

          sound: SAFE_ARRIVAL_SOUND_NAME,

          priority: Notifications.AndroidNotificationPriority.HIGH,

          ...(Platform.OS === 'android'

            ? { channelId: SAFE_ARRIVALS_CHANNEL_ID }

            : {}),

        },

        trigger: null,

      });

    } catch {

      /* fall through to in-app tone */

    }

  }



  await playSafeArrivalTone();

}



/**

 * Buzzer + notification for panic button, safe zone exit and danger zone entry.

 * SOS stays sound-only; zone events also speak so the guardian hears the zone name.

 */

export async function announceCriticalAlert(

  alertType: string,

  childName: string,

  zoneName?: string | null,

) {

  await ensureAndroidCriticalAlertChannel();



  const message = alertSpeechMessage(alertType, childName, zoneName);

  const title = alertNotificationTitle(alertType);



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

          sound: DANGER_ALERT_SOUND_NAME,

          priority: Notifications.AndroidNotificationPriority.MAX,

          ...(Platform.OS === 'android'

            ? { channelId: CRITICAL_ALERTS_CHANNEL_ID }

            : {}),

        },

        trigger: null,

      });

    } catch {

      /* fall through to in-app tone */

    }

  }



  await playDangerAlertTone();



  if (normalizeAlertType(alertType) === 'SOS') return;



  Speech.stop();

  Speech.speak(message, {

    language: 'en',

    rate: 0.92,

    pitch: 1,

    volume: 1,

  });

}



export async function announceCheckInSafe(childName: string) {

  await announceBundledBeepAlert(

    'Safe check-in',

    `${childName} confirmed they are safe`,

  );

}



export async function announceLiveAlert(

  alertType: string,

  childName: string,

  zoneName?: string | null,

) {

  if (normalizeAlertType(alertType) === 'SAFE_ZONE_ENTRY') {

    await announceSafeZoneEntry(childName, zoneName);

    return;

  }



  if (isCriticalAlertType(alertType)) {

    await announceCriticalAlert(alertType, childName, zoneName);

    return;

  }



  if (isBeepOnlyAlertType(alertType)) {

    const message = alertSpeechMessage(alertType, childName, zoneName);

    const title = alertNotificationTitle(alertType);

    await announceBundledBeepAlert(title, message);

    return;

  }



  const message = alertSpeechMessage(alertType, childName, zoneName);

  const title = alertNotificationTitle(alertType);



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



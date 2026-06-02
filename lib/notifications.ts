// FITCORE — Notifications module
// Handles permissions, Android channel, the 7-day local retention sequence,
// and (optional) Expo push-token registration with the backend.
//
// NOTE: On SDK 53+ remote push and Android scheduled notifications do NOT work
// in Expo Go — you need a development build (`eas build --profile development`)
// or a production build to test on a real device.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';

const ANDROID_CHANNEL_ID = 'default';
const RETENTION_SCHEDULED_KEY = 'fitcore.retention.scheduled.v1';
const NOTIFS_ENABLED_KEY = 'fitcore.notifs.enabled';

// ── Foreground display behavior ──────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── 7-day retention sequence (CLAUDE.md spec) ────────────────────────────────
interface RetentionNotif {
  day: number;      // 1 = day of onboarding completion
  hour: number;
  minute: number;
  title: string;
  body: string;
}

const RETENTION_SEQUENCE: RetentionNotif[] = [
  { day: 1, hour: 8,  minute: 0, title: '¡Bienvenido a FITCORE! ⚡', body: 'Tu plan está listo. Primer entreno en 30 min.' },
  { day: 2, hour: 9,  minute: 0, title: 'Racha de 2 días 🔥',         body: '¡No la rompas hoy!' },
  { day: 3, hour: 17, minute: 0, title: 'Hora de entrenar ⏰',         body: 'Tu rutina Upper Body te espera. 38 min.' },
  { day: 4, hour: 10, minute: 0, title: '¡Vas muy bien! 💪',           body: '3 entrenos esta semana. La constancia es todo.' },
  { day: 5, hour: 20, minute: 0, title: 'Tu resumen semanal 📊',       body: 'Revisa tu progreso de esta semana.' },
  { day: 6, hour: 13, minute: 0, title: 'Registra tu comida 🍽️',      body: 'Te faltan calorías para cerrar el día bien.' },
  { day: 7, hour: 9,  minute: 0, title: '¡1 semana completa! ⚡',       body: 'Mirá cuánto avanzaste en tu progreso.' },
];

// ── Android channel ──────────────────────────────────────────────────────────
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'FITCORE',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#CCFF00',
    sound: 'default',
  });
}

// ── Permissions ──────────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  // Push/notifications are not available on simulators/emulators.
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn('[notifications] running on simulator/emulator — push & scheduled notifs disabled');
    }
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }
  return status === 'granted';
}

// ── Expo push token (for server-driven push: reminders, group activity) ──────
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

// ── Register device for server-driven push ──────────────────────────────────
// Best-effort: requires a granted permission and a real device. Safe to call on
// every login; the backend upserts by (userId, token).
export async function registerForPush(authToken: string): Promise<void> {
  try {
    const granted = await requestPermissions();
    if (!granted) return;
    const pushToken = await getExpoPushToken();
    if (!pushToken) return;
    await api.registerPushToken(authToken, pushToken, Platform.OS);
  } catch {
    // non-fatal — push is an enhancement, never block the app on it
  }
}

// ── Enable / disable preference ──────────────────────────────────────────────
export async function isNotificationsEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(NOTIFS_ENABLED_KEY);
  return v !== 'false'; // default ON
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFS_ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    await cancelAllNotifications();
  } else {
    await scheduleRetentionNotifications({ force: true });
  }
}

// ── Schedule the retention sequence ──────────────────────────────────────────
export async function scheduleRetentionNotifications(opts: { force?: boolean } = {}): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const granted = await requestPermissions();
  if (!granted) return;

  await ensureAndroidChannel();

  // Avoid re-scheduling on every app open unless explicitly forced.
  if (!opts.force) {
    const already = await AsyncStorage.getItem(RETENTION_SCHEDULED_KEY);
    if (already) return;
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  const now = new Date();
  for (const n of RETENTION_SEQUENCE) {
    const fireDate = new Date(now);
    fireDate.setDate(now.getDate() + (n.day - 1));
    fireDate.setHours(n.hour, n.minute, 0, 0);

    // Skip any slot already in the past (e.g. day-1 08:00 when onboarding finishes at noon).
    if (fireDate.getTime() <= now.getTime() + 60_000) continue;

    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }

  await AsyncStorage.setItem(RETENTION_SCHEDULED_KEY, now.toISOString());
}

// ── Cancel everything (logout / disable) ─────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(RETENTION_SCHEDULED_KEY);
}

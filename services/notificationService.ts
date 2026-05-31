import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Set up Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vaultos-default', {
      name: 'VaultOS Notifikasi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('vaultos-reminders', {
      name: 'VaultOS Pengingat',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#f59e0b',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('vaultos-finance', {
      name: 'VaultOS Keuangan',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#22c55e',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (e) {
    console.log('Could not get push token:', e);
    return null;
  }
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const sb = getSupabaseClient();
    await sb.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS });
  } catch (e) {
    console.log('Could not save push token:', e);
  }
}

// ── Schedule local event reminder ───────────────────────────────────────────────
export async function scheduleEventReminder(
  eventId: string,
  title: string,
  eventDate: Date,
  reminderMinutes: number
): Promise<string | null> {
  if (reminderMinutes <= 0) return null;
  const triggerDate = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);
  if (triggerDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `event-${eventId}`,
      content: {
        title: `Pengingat: ${title}`,
        body: `${reminderMinutes} menit lagi`,
        sound: 'default',
        vibrate: [0, 300, 200, 300],
        data: { type: 'event_reminder', eventId },
        ...(Platform.OS === 'android' ? { channelId: 'vaultos-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (e) {
    console.log('Could not schedule notification:', e);
    return null;
  }
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`event-${eventId}`);
  } catch (_e) {
    // Ignore
  }
}

// ── Schedule a repeating interval notification (e.g. every 5 minutes) ────────
export async function scheduleRepeatingReminder(
  identifier: string,
  title: string,
  body: string,
  intervalSeconds: number
): Promise<string | null> {
  try {
    // Cancel any existing one with same identifier first
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    // Schedule the first occurrence after intervalSeconds
    const firstTriggerDate = new Date(Date.now() + intervalSeconds * 1000);

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: 'default',
        vibrate: [0, 200, 100, 200],
        data: { type: 'repeating', identifier },
        ...(Platform.OS === 'android' ? { channelId: 'vaultos-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalSeconds,
        repeats: true,
      },
    });
    return id;
  } catch (e) {
    console.log('Could not schedule repeating notification:', e);
    return null;
  }
}

export async function cancelRepeatingReminder(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (_e) {
    // Ignore
  }
}

// ── Send immediate local notification ──────────────────────────────────────────
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      vibrate: [0, 200],
      data: data ?? {},
      ...(Platform.OS === 'android' ? { channelId: 'vaultos-default' } : {}),
    },
    trigger: null, // Show immediately
  });
}

export async function scheduleBudgetAlert(
  category: string,
  percent: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Anggaran ${category} Hampir Habis`,
      body: `Kamu sudah menggunakan ${percent}% dari anggaran ${category}`,
      sound: 'default',
      vibrate: [0, 300],
      data: { type: 'budget_alert', category },
      ...(Platform.OS === 'android' ? { channelId: 'vaultos-finance' } : {}),
    },
    trigger: null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

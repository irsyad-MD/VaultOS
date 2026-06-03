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

// ── Timezone-safe date parser ──────────────────────────────────────────────────
// Converts "YYYY-MM-DD" + "HH:MM" into a local-timezone Date WITHOUT UTC shift.
export function buildLocalDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // new Date(y, m-1, d, h, min) always uses LOCAL timezone
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

// ── Check if a date is in the future ─────────────────────────────────────────
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

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
    await Notifications.setNotificationChannelAsync('vaultos-deadline', {
      name: 'VaultOS Deadline',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#ef4444',
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

// ── Schedule local event reminder (TIMEZONE-FIXED) ────────────────────────────
// Pass dateStr "YYYY-MM-DD" and timeStr "HH:MM" for accurate local scheduling.
export async function scheduleEventReminder(
  eventId: string,
  title: string,
  localDate: Date,          // Must be a LOCAL timezone Date (use buildLocalDate)
  reminderMinutes: number
): Promise<string | null> {
  if (reminderMinutes <= 0) return null;

  const triggerDate = new Date(localDate.getTime() - reminderMinutes * 60 * 1000);

  if (!isFutureDate(triggerDate)) {
    console.log(`[Notification] Trigger time already passed for "${title}": ${triggerDate.toLocaleString()}`);
    return null;
  }

  console.log(`[Notification] Scheduling "${title}" at ${triggerDate.toLocaleString()} (local time)`);

  try {
    const identifier = `event-${eventId}`;
    // Cancel any previous notification for same event
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `⏰ Pengingat Jadwal`,
        body: `"${title}" dimulai ${reminderMinutes >= 60 ? `${reminderMinutes / 60} jam` : `${reminderMinutes} menit`} lagi`,
        sound: 'default',
        data: { type: 'event_reminder', eventId },
        ...(Platform.OS === 'android' ? { channelId: 'vaultos-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`[Notification] Scheduled ID: ${id} at ${triggerDate.toLocaleString()}`);
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

// ── Schedule task deadline notification ───────────────────────────────────────
export async function scheduleTaskDeadline(
  taskId: string,
  title: string,
  deadlineDate: Date,         // LOCAL timezone date
  minutesBefore: number = 60  // Default: 1 hour before
): Promise<string | null> {
  const triggerDate = new Date(deadlineDate.getTime() - minutesBefore * 60 * 1000);

  if (!isFutureDate(triggerDate)) {
    // Try to schedule AT the deadline itself
    if (!isFutureDate(deadlineDate)) {
      console.log(`[Notification] Deadline already passed for task "${title}"`);
      return null;
    }
    // Schedule AT deadline
    return scheduleTaskAtDeadline(taskId, title, deadlineDate);
  }

  try {
    const identifier = `task-${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `📋 Deadline Tugas Mendekat!`,
        body: `"${title}" deadline ${minutesBefore >= 60 ? `${minutesBefore / 60} jam` : `${minutesBefore} menit`} lagi`,
        sound: 'default',
        data: { type: 'task_deadline', taskId },
        ...(Platform.OS === 'android' ? { channelId: 'vaultos-deadline' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`[Notification] Task deadline scheduled: "${title}" at ${triggerDate.toLocaleString()}`);
    return id;
  } catch (e) {
    console.log('Could not schedule task deadline notification:', e);
    return null;
  }
}

async function scheduleTaskAtDeadline(taskId: string, title: string, deadlineDate: Date): Promise<string | null> {
  try {
    const identifier = `task-at-${taskId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `🔴 Deadline Tugas Sekarang!`,
        body: `"${title}" sudah mencapai batas waktu`,
        sound: 'default',
        data: { type: 'task_deadline_now', taskId },
        ...(Platform.OS === 'android' ? { channelId: 'vaultos-deadline' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: deadlineDate,
      },
    });
    return id;
  } catch (e) {
    return null;
  }
}

export async function cancelTaskDeadline(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`);
    await Notifications.cancelScheduledNotificationAsync(`task-at-${taskId}`);
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
      data: data ?? {},
      ...(Platform.OS === 'android' ? { channelId: 'vaultos-default' } : {}),
    },
    trigger: null,
  });
}

export async function scheduleBudgetAlert(
  category: string,
  percent: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ Anggaran ${category} Hampir Habis`,
      body: `Kamu sudah menggunakan ${percent}% dari anggaran ${category}`,
      sound: 'default',
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

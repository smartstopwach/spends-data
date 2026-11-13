import { Capacitor } from '@capacitor/core';

/**
 * Thin wrapper around Capacitor plugins so the web build keeps working
 * exactly as before when the native APIs are unavailable.
 */
export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const platform = (): string => {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
};

/* ── Haptics ────────────────────────────────────────────── */
type HapticStyle = 'light' | 'medium' | 'heavy';

export async function haptic(style: HapticStyle = 'light'): Promise<void> {
  if (!isNative()) {
    try {
      navigator.vibrate?.(style === 'heavy' ? [18] : style === 'medium' ? [12] : [8]);
    } catch {
      // ignore
    }
    return;
  }
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({
      style:
        style === 'heavy'
          ? ImpactStyle.Heavy
          : style === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light,
    });
  } catch {
    // ignore
  }
}

/* ── Share ──────────────────────────────────────────────── */
export async function shareText(title: string, text: string): Promise<boolean> {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, dialogTitle: title });
      return true;
    } catch {
      return false;
    }
  }
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
  } catch {
    // cancelled
  }
  return false;
}

/* ── Status bar / splash ────────────────────────────────── */
export async function setupNativeShell(): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    if (platform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#F6F7F9' });
    }
  } catch {
    // ignore
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // ignore
  }
}

/* ── Local notifications (real background scheduling) ───── */
export interface NativeReminderPlan {
  enabled: boolean;
  hour: number;
  daily: boolean;
  walletAlert: boolean;
  reportReminder: boolean;
}

const NOTIFICATION_IDS = { daily: 1001, wallet: 1002, report: 1003 };
const CHANNEL_ID = 'spends-data-reminders';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    return (await Notification.requestPermission()) === 'granted';
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch {
    return false;
  }
}

/** Cancels and re-schedules the repeating reminders inside the OS. */
export async function scheduleNativeReminders(plan: NativeReminderPlan): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIFICATION_IDS.daily },
        { id: NOTIFICATION_IDS.wallet },
        { id: NOTIFICATION_IDS.report },
      ],
    });

    if (!plan.enabled) return true;

    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Spends Data reminders',
        description: 'Daily logging, money-left and weekly report reminders',
        importance: 3,
        visibility: 1,
        vibration: true,
      });
    } catch {
      // channels are Android-only
    }

    const notifications = [];

    if (plan.daily) {
      notifications.push({
        id: NOTIFICATION_IDS.daily,
        title: "Log today's spends",
        body: 'Takes 5 seconds — keep your balance accurate.',
        channelId: CHANNEL_ID,
        schedule: {
          on: { hour: plan.hour, minute: 0 },
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_spends',
        autoCancel: true,
      });
    }

    if (plan.walletAlert) {
      notifications.push({
        id: NOTIFICATION_IDS.wallet,
        title: 'Check your money left',
        body: 'Open Spends Data to see how much is left this month.',
        channelId: CHANNEL_ID,
        schedule: {
          on: { hour: 20, minute: 30, weekday: 6 },
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_spends',
        autoCancel: true,
      });
    }

    if (plan.reportReminder) {
      notifications.push({
        id: NOTIFICATION_IDS.report,
        title: 'Weekly report ready',
        body: 'Your 7-day spend summary is ready to email.',
        channelId: CHANNEL_ID,
        schedule: {
          on: { hour: 10, minute: 0, weekday: 2 },
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_spends',
        autoCancel: true,
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }

    /* Tapping a notification should open the app. */
    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      window.location.hash = '';
    });

    return true;
  } catch {
    return false;
  }
}

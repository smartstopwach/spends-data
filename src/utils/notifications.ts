const KEY = 'spends_data_notifications_v1';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderHour: number;
  budgetAlerts: boolean;
  reportReminder: boolean;
  sound: boolean;
  lastDaily: string | null;
  lastBudget: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  reminderHour: 21,
  budgetAlerts: true,
  reportReminder: true,
  sound: true,
  lastDaily: null,
  lastBudget: null,
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(parsed ?? {}) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionState(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/** Shows a notification through the service worker when available. */
export async function showAppNotification(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const options: NotificationOptions & { badge?: string } = {
    body,
    tag,
    icon: './icon-192.png',
    badge: './favicon.png',
    data: { url: './' },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch {
    // ignore
  }
}

export function vibrate(pattern: number | number[] = 12): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

export async function shareSummary(title: string, text: string): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
  } catch {
    // user cancelled or unsupported
  }
  return false;
}

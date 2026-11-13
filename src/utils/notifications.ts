const KEY = 'spends_data_notifications_v1';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderHour: number;
  walletAlerts: boolean;
  reportReminder: boolean;
  sound: boolean;
  streakCelebration: boolean;
  weeklyInsight: boolean;
  richActions: boolean;
  lastDaily: string | null;
  lastWallet: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  reminderHour: 21,
  walletAlerts: true,
  reportReminder: true,
  sound: true,
  streakCelebration: true,
  weeklyInsight: true,
  richActions: true,
  lastDaily: null,
  lastWallet: null,
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

export interface RichNotification {
  title: string;
  body: string;
  tag: string;
  kind?: 'daily' | 'wallet' | 'report' | 'streak' | 'test' | 'insight';
  actions?: Array<{ action: string; title: string }>;
  url?: string;
}

/** Shows a rich notification through the service worker when available. */
export async function showAppNotification(input: RichNotification): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  type NotificationAction = { action: string; title: string; icon?: string };
  const options: NotificationOptions & {
    badge?: string;
    actions?: NotificationAction[];
    vibrate?: number[];
  } = {
    body: input.body,
    tag: input.tag,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [12, 40, 12],
    requireInteraction: false,
    data: { url: input.url ?? './', kind: input.kind ?? 'test' },
    actions: input.actions?.slice(0, 2).map((action) => ({
      action: action.action,
      title: action.title,
      icon: './icon-192.png',
    })),
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(input.title, options);
        return;
      }
    }
    new Notification(input.title, options);
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

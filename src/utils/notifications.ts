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
  reminderHour: 20,
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

/* ── First-run permission prompt ─────────────────────────── */
const PROMPT_KEY = 'spends_data_notif_prompt_v1';
export const PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function loadPromptDismissedAt(): number | null {
  try {
    const raw = window.localStorage.getItem(PROMPT_KEY);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function rememberPromptDismissed(now: number = Date.now()): void {
  try {
    window.localStorage.setItem(PROMPT_KEY, String(now));
  } catch {
    // ignore
  }
}

/**
 * Whether to show the in-app "Allow notifications?" prompt. Pure, so it can be tested:
 * - never when notifications are already on,
 * - on the web only while the browser has not decided yet ('default'),
 * - on Android always (the OS dialog handles the decision),
 * - not again for 7 days after "Not now".
 */
export function shouldAskForNotifications(input: {
  enabled: boolean;
  permission: NotificationPermission | 'unsupported';
  native: boolean;
  dismissedAt: number | null;
  now: number;
}): boolean {
  if (input.enabled) return false;
  if (input.dismissedAt !== null && input.now - input.dismissedAt < PROMPT_SNOOZE_MS) return false;
  if (input.native) return true;
  return input.permission === 'default';
}

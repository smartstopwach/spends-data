import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  loadNotificationSettings,
  notificationsSupported,
  permissionState,
  saveNotificationSettings,
  showAppNotification,
} from '../utils/notifications';
import { getTodayISO } from '../utils/mathAndFormat';
import {
  SwSnapshot,
  composeNotification,
} from '../utils/notificationCopy';
import { isNative, scheduleNativeReminders } from '../utils/native';

interface ReminderContext {
  spendCountToday: number;
  moneyLeft: number;
  reportDue: boolean;
  snapshot: SwSnapshot;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    permissionState()
  );

  useEffect(() => {
    setSettings(loadNotificationSettings());
  }, []);

  const update = useCallback((next: NotificationSettings) => {
    setSettings(next);
    saveNotificationSettings(next);
    // On a native build, mirror the plan into OS-level scheduling so reminders
    // still fire when the app is closed.
    if (isNative()) {
      void scheduleNativeReminders({
        enabled: next.enabled,
        hour: next.reminderHour,
        daily: next.dailyReminder,
        walletAlert: next.walletAlerts,
        reportReminder: next.reportReminder,
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!notificationsSupported()) return 'unsupported' as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      update({ ...loadNotificationSettings(), enabled: true });
    }
    return result;
  }, [update]);

  const notify = useCallback(
    async (input: {
      title: string;
      body: string;
      tag: string;
      kind?: 'daily' | 'wallet' | 'report' | 'streak' | 'test' | 'insight';
      actions?: Array<{ action: string; title: string }>;
      url?: string;
    }) => {
      await showAppNotification(input);
    },
    []
  );

  /** Composes a context-aware notification from live numbers. */
  const notifyFromSnapshot = useCallback(
    async (kind: 'daily' | 'wallet' | 'report' | 'streak' | 'insight' | 'test', snapshot: SwSnapshot) => {
      const payload = composeNotification(kind, snapshot);
      await showAppNotification({
        title: payload.title,
        body: payload.body,
        tag: payload.tag,
        kind: payload.kind,
        actions: settings.richActions ? payload.actions : undefined,
        url: (payload.data?.url as string) ?? './',
      });
    },
    [settings.richActions]
  );

  /**
   * Evaluates reminder rules once an environment provides fresh context:
   * daily logging nudge, money-left nudge and the weekly report reminder.
   */
  const evaluate = useCallback(
    (context: ReminderContext) => {
      if (!settings.enabled || permission !== 'granted') return;
      const today = getTodayISO();
      const hour = new Date().getHours();
      const patches: Partial<NotificationSettings> = {};

      if (
        settings.dailyReminder &&
        settings.lastDaily !== today &&
        hour >= settings.reminderHour &&
        context.spendCountToday === 0
      ) {
        void notifyFromSnapshot('daily', context.snapshot);
        patches.lastDaily = today;
      }

      const monthKey = today.slice(0, 7);
      if (
        settings.walletAlerts &&
        settings.lastWallet !== monthKey &&
        context.moneyLeft <= 0
      ) {
        void notifyFromSnapshot('wallet', context.snapshot);
        patches.lastWallet = monthKey;
      }

      if (settings.reportReminder && context.reportDue) {
        void notifyFromSnapshot('report', context.snapshot);
      }

      if (Object.keys(patches).length > 0) {
        update({ ...loadNotificationSettings(), ...patches });
        setSettings((prev) => ({ ...prev, ...patches }));
      }
    },
    [settings, permission, notifyFromSnapshot, update]
  );

  /** App icon badge (Chrome / installed PWAs). */
  const badgeCount = useMemo(() => {
    if (!settings.enabled) return 0;
    let count = 0;
    if (settings.dailyReminder) count += 1;
    if (settings.walletAlerts) count += 1;
    if (settings.reportReminder) count += 1;
    return Math.min(count, 9);
  }, [settings]);

  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (badgeCount > 0) void nav.setAppBadge?.(badgeCount);
    else void nav.clearAppBadge?.();
  }, [badgeCount]);

  return {
    settings,
    update,
    permission,
    requestPermission,
    notify,
    notifyFromSnapshot,
    evaluate,
    supported: notificationsSupported(),
  };
}

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
import { isNative, scheduleNativeReminders } from '../utils/native';

interface ReminderContext {
  spendCountToday: number;
  budgetUsedPercent: number;
  reportDue: boolean;
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
        budgetAlert: next.budgetAlerts,
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

  const notify = useCallback(async (title: string, body: string, tag: string) => {
    await showAppNotification(title, body, tag);
  }, []);

  /**
   * Evaluates reminder rules once an environment provides fresh context:
   * daily logging nudge, budget alert at 90% and the weekly report reminder.
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
        void notify(
          "Log today's spends",
          'No entry yet today — tap to add your spends in a few seconds.',
          'daily-reminder'
        );
        patches.lastDaily = today;
      }

      const monthKey = today.slice(0, 7);
      if (
        settings.budgetAlerts &&
        settings.lastBudget !== monthKey &&
        context.budgetUsedPercent >= 90
      ) {
        void notify(
          'Budget almost used',
          `You have used ${Math.round(context.budgetUsedPercent)}% of this month's budget.`,
          'budget-alert'
        );
        patches.lastBudget = monthKey;
      }

      if (settings.reportReminder && context.reportDue) {
        void notify(
          'Weekly report is ready',
          'Your 7-day spend summary is waiting — send it to your email.',
          'report-due'
        );
      }

      if (Object.keys(patches).length > 0) {
        update({ ...loadNotificationSettings(), ...patches });
        setSettings((prev) => ({ ...prev, ...patches }));
      }
    },
    [settings, permission, notify, update]
  );

  /** App icon badge (Chrome / installed PWAs). */
  const badgeCount = useMemo(() => {
    if (!settings.enabled) return 0;
    let count = 0;
    if (settings.dailyReminder) count += 1;
    if (settings.budgetAlerts) count += 1;
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

  return { settings, update, permission, requestPermission, notify, evaluate, supported: notificationsSupported() };
}

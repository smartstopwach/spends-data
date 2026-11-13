/**
 * Reminder timing shared by OS-level (Android) notifications and web push, so the
 * same reminders fire on either platform. Daily reminder hour comes from settings.
 */
export interface WeeklySlot {
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  weekday: number;
  hour: number;
  minute: number;
}

export const WALLET_ALERT_SLOT: WeeklySlot = { weekday: 6, hour: 20, minute: 30 };
/** Evening, so the weekly reminder lands when the day is winding down. */
export const REPORT_REMINDER_SLOT: WeeklySlot = { weekday: 2, hour: 19, minute: 0 };

export const REMINDER_IDS = { daily: 1001, wallet: 1002, report: 1003 } as const;
export type ReminderKind = keyof typeof REMINDER_IDS;

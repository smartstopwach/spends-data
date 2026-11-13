
/**
 * Runs inside the service worker (no DOM, no localStorage access from the page):
 * the page hydrates it with a snapshot and it renders rich notifications.
 */
export interface SwNotificationPayload {
  title: string;
  body: string;
  tag: string;
  kind: 'daily' | 'wallet' | 'report' | 'streak' | 'test' | 'insight';
  actions?: Array<{ action: string; title: string }>;
  data?: Record<string, unknown>;
}

export interface SwSnapshot {
  todaySpend: number;
  todayIncome: number;
  todayEntries: number;
  weekSpend: number;
  weekIncome: number;
  monthSpend: number;
  moneyLeft: number;
  walletBalance: number;
  topCategory: string | null;
  topCategoryAmount: number;
  streakDays: number;
  lastEntryNote: string | null;
  lastEntryAmount: number | null;
}

const fmt = (value: number): string => {
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rounded)}`;
};

/** Deterministic-but-varied pick so the copy changes daily without flapping on rerenders. */
const pick = <T,>(items: T[], salt = 0): T =>
  items[(new Date().getDate() + salt) % items.length];

/** Builds a context-aware notification with numbers from the snapshot. */
export function composeNotification(
  kind: SwNotificationPayload['kind'],
  snapshot: SwSnapshot
): SwNotificationPayload {
  const day = new Date().toLocaleDateString('en-IN', { weekday: 'long' });

  switch (kind) {
    case 'daily': {
      if (snapshot.todayEntries === 0) {
        return {
          kind,
          tag: 'spends-daily',
          title: pick([
            `Add today's spends, ${day}?`,
            'Quick check-in 🧾',
            'Keep the day closed',
          ]),
          body: pick([
            `Nothing logged today yet. Balance is ${fmt(snapshot.walletBalance)} — takes 5 seconds to update.`,
            `Today is still empty. Add chai, auto and mess in one tap.`,
            `Balance ${fmt(snapshot.walletBalance)} · ${snapshot.streakDays}-day streak on the line.`,
          ]),
          actions: [
            { action: 'add-spend', title: 'Add spend' },
            { action: 'open', title: 'Open app' },
          ],
          data: { url: './#home' },
        };
      }
      return {
        kind,
        tag: 'spends-daily',
        title: `${fmt(snapshot.todaySpend)} spent today`,
        body:
          snapshot.topCategory !== null
            ? `Biggest: ${snapshot.topCategory} (${fmt(snapshot.topCategoryAmount)}). Balance ${fmt(
                snapshot.walletBalance
              )}.`
            : `Balance ${fmt(snapshot.walletBalance)} · ${snapshot.todayEntries} ${
                snapshot.todayEntries === 1 ? 'entry' : 'entries'
              } today.`,
        actions: [{ action: 'open', title: 'Review' }],
        data: { url: './#transactions' },
      };
    }

    case 'wallet': {
      const left = Math.round(snapshot.moneyLeft);
      const short = left <= 0;
      const daysLeft = Math.max(1, 30 - new Date().getDate() + 1);
      return {
        kind,
        tag: 'spends-wallet',
        title: short
          ? 'Spent more than came in 💸'
          : left < 500
          ? 'Running low'
          : pick([`${fmt(left)} left`, 'Money check', 'What is left'], 1),
        body: short
          ? `You are ${fmt(Math.abs(left))} over the money received this month. Add the next credit or ease off for a bit.`
          : `${fmt(left)} of this month's money is still unspent — about ${fmt(
              Math.round(left / daysLeft)
            )} a day for the rest of the month.`,
        actions: [
          { action: 'open', title: 'See breakdown' },
          { action: 'dismiss', title: 'Later' },
        ],
        data: { url: './#home' },
      };
    }

    case 'report': {
      return {
        kind,
        tag: 'spends-report',
        title: 'Your weekly report is ready 📬',
        body: `Last 7 days: ${fmt(snapshot.weekSpend)} out, ${fmt(
          snapshot.weekIncome
        )} in. Send it to your inbox in one tap.`,
        actions: [
          { action: 'open-reports', title: 'Send report' },
          { action: 'dismiss', title: 'Later' },
        ],
        data: { url: './#reports' },
      };
    }

    case 'streak': {
      return {
        kind,
        tag: 'spends-streak',
        title: `${snapshot.streakDays}-day logging streak 🔥`,
        body: `You have tracked every day. Balance ${fmt(
          snapshot.walletBalance
        )} — keep the streak alive.`,
        actions: [{ action: 'open', title: 'Nice' }],
        data: { url: './#transactions' },
      };
    }

    case 'insight': {
      return {
        kind,
        tag: 'spends-insight',
        title: snapshot.topCategory
          ? `${snapshot.topCategory} is your top spend`
          : 'Weekly insight',
        body: snapshot.topCategory
          ? `${fmt(snapshot.topCategoryAmount)} this week on ${snapshot.topCategory}. Tap to see every entry.`
          : 'Log a few spends to unlock weekly insights.',
        actions: [{ action: 'open', title: 'View' }],
        data: { url: './#transactions' },
      };
    }

    default:
      return {
        kind: 'test',
        tag: 'spends-test',
        title: 'Notifications are working ✅',
        body: snapshot.lastEntryNote
          ? `Last entry: ${snapshot.lastEntryNote} · ${fmt(snapshot.lastEntryAmount ?? 0)}`
          : 'You will get reminders like this at your chosen time.',
        actions: [{ action: 'open', title: 'Open' }],
        data: { url: './' },
      };
  }
}

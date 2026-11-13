/**
 * Copy for the scheduled reminders (Android and Web Push). The worker keeps a copy in
 * functions/worker.js; change both together.
 */
export const REMINDER_COPY = {
  daily: {
    title: 'Evening check-in 🌙',
    body: "Add today's spends before the day closes. Takes 5 seconds.",
    tag: 'daily',
    url: './#home',
  },
  wallet: {
    title: 'Money check 💰',
    body: "See how much of this month's money is still left.",
    tag: 'wallet',
    url: './#home',
  },
  report: {
    title: 'Your weekly report is ready 📬',
    body: 'Last 7 days of spends, ready to send in one tap.',
    tag: 'report',
    url: './#reports',
  },
} as const;

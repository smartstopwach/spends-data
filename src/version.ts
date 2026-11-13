export const APP_VERSION = '1.4.0';

export interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.4.0',
    title: 'Background notifications and Android reminders',
    date: 'November 2026',
    items: [
      'Installed app sends reminders in the background, even when it is closed (Web Push).',
      'Turn it on in Settings → Notifications; it uses the worker from Reports → Background delivery.',
      'Android app: reminders are scheduled by the phone itself, so they arrive with the app closed.',
      'Daily, money-left and weekly report reminders share one schedule on every platform.',
    ],
  },
  {
    version: '1.3.0',
    title: 'Install Spends Data as an app',
    date: 'November 2026',
    items: [
      'Download tab: one tap installs Spends Data on your phone or computer.',
      'Opens full screen from your home screen or app list.',
      'Works offline after the first visit.',
      'Same data as the browser you install from.',
    ],
  },
  {
    version: '1.2.0',
    title: 'Weekly, month views and notifications',
    date: 'November 2026',
    items: [
      'Week / Month / All-time switcher with prev-next steppers on every screen.',
      'Dynamic notifications with action buttons, streak and insight reminders.',
      'Live notification preview in Settings, plus background reminder scheduling.',
      'Optional background email worker so weekly reports arrive without opening the app.',
      'Spends Data rebrand and all-English interface.',
    ],
  },
  {
    version: '1.1.0',
    title: 'Email reports',
    date: 'November 2026',
    items: [
      'New app icons and quicker startup.',
      'Weekly spend reports with an itemised day-by-day breakdown.',
      'Pick any custom date range for a report.',
      'Smooth gradient trend chart with hover details.',
      'Clearer English copy and a faster Transactions section.',
    ],
  },
  {
    version: '1.0.0',
    title: 'First public release',
    date: 'November 2026',
    items: [
      'Track money in and daily spends with inline math.',
      'Day-wise transaction history with search and filters.',
      'Category breakdown, money left and running balance.',
      'CSV export and JSON backup stored safely in your browser.',
    ],
  },
];

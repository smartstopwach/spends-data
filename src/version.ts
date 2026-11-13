export const APP_VERSION = '1.2.0';

export interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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

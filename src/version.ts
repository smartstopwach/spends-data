export const APP_VERSION = '1.1.0';

export interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    title: 'Installable app + email reports',
    date: 'November 2026',
    items: [
      'Install Spends Data on your home screen — opens full screen and works offline.',
      'New app icons, quicker startup and automatic in-app updates.',
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
      'Category breakdown, budget pace and running balance.',
      'CSV export and JSON backup stored safely in your browser.',
    ],
  },
];

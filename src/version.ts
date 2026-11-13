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
    title: 'Weekly, month views, notifications and an Android app',
    date: 'November 2026',
    items: [
      'Week / Month / All-time switcher with prev-next steppers on every screen.',
      'Dynamic notifications with action buttons, streak and insight reminders.',
      'Live notification preview in Settings, plus background reminder scheduling.',
      'Optional background email worker so weekly reports arrive without opening the app.',
      'Real Android app (Capacitor) with home-screen icon, splash and OS-level reminders.',
      'Spends Data rebrand and all-English interface.',
    ],
  },
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

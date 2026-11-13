import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';
import { TransactionTabsCard } from './components/TransactionTabsCard';
import { DownloadPage } from './components/DownloadPage';
import { createSampleTransactions } from './constants';

describe('Full App Render Smoke Test', () => {
  it('renders the home overview without crashing', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('Spends Data');
    expect(html).toContain('Overview');
    expect(html).toContain('Available Balance');
    expect(html).toContain('Money In');
    expect(html).toContain('Total Spends');
    expect(html).toContain('Latest Activity');
    expect(html).toContain('Transactions');
    expect(html).toContain('Settings');
    // A fresh visit always opens with real (empty) data, never sample rows.
    expect(html).toContain('No entries yet');
    expect(html).not.toContain('demo-');
  });

  it('renders the standalone transactions section with tabs', () => {
    const html = renderToString(
      React.createElement(TransactionTabsCard, {
        transactions: createSampleTransactions(new Date()),
        selectedCategory: 'all',
        onClearCategory: () => {},
        onDelete: () => {},
        onLoadDemo: () => {},
        totalOverallCount: 12,
        monthLabel: 'November 2026',
      })
    );
    expect(html).toContain('Recent entries');
    expect(html).toContain('All Activity');
    expect(html).toContain('Spends');
    expect(html).toContain('Money in');
  });
});

describe('Active state & dummy data hygiene', () => {
  it('has no budget concept anywhere', () => {
    const html = renderToString(React.createElement(App));
    expect(html).not.toContain('8,500');
    expect(html).not.toContain('8500');
    expect(html.toLowerCase()).not.toContain('budget');
  });

  it('marks the active navigation item for assistive tech', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('aria-current');
  });
});

describe('Download tab', () => {
  it('offers both native and website install', () => {
    const html = renderToString(
      React.createElement(DownloadPage, {
        pwa: {
          install: async () => 'manual' as const,
          installed: false,
          canNativePrompt: false,
          platform: 'desktop' as const,
        },
      })
    );
    expect(html).toContain('Android APK file');
    expect(html).toContain('Install Spends Data');
    expect(html).toContain('Download app');
    expect(html).toContain('All releases');
  });
});

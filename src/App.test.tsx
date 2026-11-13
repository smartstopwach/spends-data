import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';
import { TransactionTabsCard } from './components/TransactionTabsCard';
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
    expect(html).toContain('₹5,692');
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

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppNav } from './AppNav';

const counts = { transactions: 0, reports: 0 };

describe('AppNav', () => {
  it('renders the phone bottom bar with every section', () => {
    const html = renderToStaticMarkup(
      React.createElement(AppNav, { variant: 'mobile', view: 'home', onNavigate: vi.fn(), counts })
    );
    expect(html).toContain('fixed inset-x-0 bottom-0');
    for (const label of ['Home', 'Transactions', 'Reports', 'Download', 'Settings']) {
      expect(html).toContain(`>${label}</span>`);
    }
    expect(html).not.toContain('md:hidden"');
  });

  it('renders the desktop segmented control without the bottom bar', () => {
    const html = renderToStaticMarkup(
      React.createElement(AppNav, { variant: 'desktop', view: 'home', onNavigate: vi.fn(), counts })
    );
    expect(html).not.toContain('fixed inset-x-0 bottom-0');
    expect(html).toContain('Settings');
  });
});

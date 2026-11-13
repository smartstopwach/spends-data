import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppNav } from './AppNav';

const counts = { transactions: 0, reports: 0 };

describe('AppNav', () => {
  it('renders one bottom bar with every section', () => {
    const html = renderToStaticMarkup(
      React.createElement(AppNav, { view: 'home', onNavigate: vi.fn(), counts })
    );
    expect(html).toContain('fixed inset-x-0 bottom-0');
    for (const label of ['Home', 'Transactions', 'Reports', 'Download', 'Settings']) {
      expect(html).toContain(`>${label}</span>`);
    }
  });

  it('marks the current view as the active page', () => {
    const html = renderToStaticMarkup(
      React.createElement(AppNav, { view: 'reports', onNavigate: vi.fn(), counts })
    );
    expect(html).toMatch(/aria-current="page"[^>]*>[\s\S]*?Reports<\/span>/);
  });
});

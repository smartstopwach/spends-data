import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Full App Render Smoke Test', () => {
  it('renders GharKaHisaab aesthetic bento cards without crashing', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('GharKaHisaab');
    expect(html).toContain('Abhi Bacha Paisa');
    expect(html).toContain('Ghar Se');
    expect(html).toContain('Spends');
    expect(html).toContain('Recent Hisaab');
    expect(html).toContain('₹5,692');
  });
});

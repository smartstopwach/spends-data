import { describe, expect, it } from 'vitest';
import { currentPeriod, resolvePeriod, shiftPeriod } from './period';

describe('period filters (week / month / all)', () => {
  it('resolves a Monday–Sunday week', () => {
    const info = resolvePeriod({ mode: 'week', anchor: '2026-11-13' }); // Friday
    expect(info.fromISO).toBe('2026-11-09'); // Monday
    expect(info.toISO).toBe('2026-11-15'); // Sunday
    expect(info.mode).toBe('week');
  });

  it('resolves full month ranges including leap years', () => {
    const nov = resolvePeriod({ mode: 'month', anchor: '2026-11' });
    expect(nov.fromISO).toBe('2026-11-01');
    expect(nov.toISO).toBe('2026-11-30');

    const feb = resolvePeriod({ mode: 'month', anchor: '2024-02' });
    expect(feb.toISO).toBe('2024-02-29');
  });

  it('treats all time as an unbounded range', () => {
    const all = resolvePeriod({ mode: 'all', anchor: '2026-11' });
    expect(all.fromISO).toBe('0000-01-01');
    expect(all.toISO).toBe('9999-12-31');
    expect(all.label).toBe('All time');
  });

  it('shifts weeks and months without drifting', () => {
    const week = { mode: 'week' as const, anchor: '2026-11-09' };
    expect(shiftPeriod(week, -1).anchor).toBe('2026-11-02');
    expect(shiftPeriod(week, 1).anchor).toBe('2026-11-16');

    const prevMonth = shiftPeriod({ mode: 'month', anchor: '2026-01' }, -1);
    expect(prevMonth.anchor).toBe('2025-12');
  });

  it('builds a sensible default period', () => {
    expect(currentPeriod('month').mode).toBe('month');
    expect(currentPeriod('week').anchor).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('disables forward navigation for the current period', () => {
    const thisMonth = resolvePeriod(currentPeriod('month'));
    expect(thisMonth.canGoNext).toBe(false);

    const lastMonth = resolvePeriod(shiftPeriod(currentPeriod('month'), -1));
    expect(lastMonth.canGoNext).toBe(true);
  });
});

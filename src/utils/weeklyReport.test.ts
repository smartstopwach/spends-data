import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { DEFAULT_REPORT_CONFIG, isReportDue, isoWeekday, isValidEmail } from './reportConfig';
import { buildReport, buildWeeklyReport, resolveReportRange } from './weeklyReport';

const tx = (
  date: string,
  amount: number,
  type: 'income' | 'spend',
  category = type === 'income' ? 'home' : 'food'
): Transaction => ({
  id: `${type}-${date}-${amount}-${category}`,
  type,
  amount,
  category: category as Transaction['category'],
  paymentMode: 'upi',
  date,
  note: 'test',
  createdAt: 1,
});

describe('buildWeeklyReport', () => {
  it('aggregates the last 7 days only', () => {
    const report = buildWeeklyReport(
      [
        tx('2026-11-13', 200, 'spend'),
        tx('2026-11-12', 100, 'spend', 'travel'),
        tx('2026-11-08', 800, 'income'),
        tx('2026-11-01', 9999, 'spend'), // outside the window
      ],
      '2026-11-13'
    );

    expect(report.fromISO).toBe('2026-11-07');
    expect(report.toISO).toBe('2026-11-13');
    expect(report.spend).toBe(300);
    expect(report.income).toBe(800);
    expect(report.net).toBe(500);
    expect(report.spendCount).toBe(2);
    expect(report.incomeCount).toBe(1);
    expect(report.dailyRows).toHaveLength(3); // only days that actually have entries
    expect(report.days).toBe(7);
    expect(report.categories[0].label).toBe('Food & Chai');
    expect(report.walletBalance).toBe(-9499);
    expect(report.subject).toContain('GharKaHisaab');
    expect(report.text).toContain('Daily avg');
    expect(report.html).toContain('Spend Report');
    expect(report.html).toContain('Karcha kaise hua');
  });

  it('handles an empty week gracefully', () => {
    const report = buildWeeklyReport([], '2026-11-13');
    expect(report.spend).toBe(0);
    expect(report.income).toBe(0);
    expect(report.categories).toHaveLength(0);
    expect(report.dailyAvg).toBe(0);
    expect(report.topCategory).toBeNull();
  });
});

describe('report scheduling', () => {
  it('validates emails', () => {
    expect(isValidEmail('someone@gmail.com')).toBe(true);
    expect(isValidEmail('bad@')).toBe(false);
  });

  it('computes ISO weekdays', () => {
    expect(isoWeekday('2026-11-13')).toBe(5); // Friday
    expect(isoWeekday('2026-11-15')).toBe(7); // Sunday
    expect(isoWeekday('2026-11-16')).toBe(1); // Monday
  });

  it('marks a report due only on the chosen day, after the hour, once', () => {
    const config = { ...DEFAULT_REPORT_CONFIG, enabled: true, email: 'a@gmail.com', weekday: 1 };

    expect(isReportDue(config, '2026-11-16', 9)).toBe(true);
    expect(isReportDue(config, '2026-11-16', 8)).toBe(false); // too early
    expect(isReportDue(config, '2026-11-17', 10)).toBe(false); // wrong day
    expect(isReportDue({ ...config, lastSentDate: '2026-11-16' }, '2026-11-16', 12)).toBe(false);
    expect(isReportDue({ ...config, enabled: false }, '2026-11-16', 12)).toBe(false);
    expect(isReportDue({ ...config, email: '' }, '2026-11-16', 12)).toBe(false);
  });
});

describe('itemised report (karcha kaise hua)', () => {
  const data: Transaction[] = [
    tx('2026-11-13', 200, 'spend'),
    tx('2026-11-13', 60, 'spend', 'travel'),
    tx('2026-11-12', 500, 'income'),
    tx('2026-11-10', 1000, 'spend', 'rent'),
  ];

  it('lists every entry grouped by day with day totals', () => {
    const report = buildReport(data, { fromISO: '2026-11-07', toISO: '2026-11-13' });
    expect(report.dayGroups).toHaveLength(3);
    expect(report.dayGroups[0].date).toBe('2026-11-13');
    expect(report.dayGroups[0].items).toHaveLength(2);
    expect(report.dayGroups[0].spend).toBe(260);
    expect(report.dayGroups[1].income).toBe(500);
    expect(report.entryCount).toBe(4);
    expect(report.biggestSpend?.amount).toBe(1000);
    expect(report.text).toContain('KARCHA KAISE HUA');
    expect(report.text).toContain('Rent & PG/Mess');
    expect(report.html).toContain('Karcha kaise hua');
  });

  it('honours an arbitrary from → to range', () => {
    const report = buildReport(data, { fromISO: '2026-11-10', toISO: '2026-11-12' });
    expect(report.spend).toBe(1000);
    expect(report.income).toBe(500);
    expect(report.days).toBe(3);
    expect(report.dayGroups).toHaveLength(2);
  });

  it('resolves range presets including custom dates', () => {
    const last7 = resolveReportRange({ rangeMode: 'last7' }, '2026-11-13');
    expect(last7.fromISO).toBe('2026-11-07');
    expect(last7.days).toBe(7);

    const month = resolveReportRange({ rangeMode: 'thisMonth' }, '2026-11-13');
    expect(month.fromISO).toBe('2026-11-01');

    const custom = resolveReportRange(
      { rangeMode: 'custom', customFrom: '2026-10-01', customTo: '2026-10-15' },
      '2026-11-13'
    );
    expect(custom.fromISO).toBe('2026-10-01');
    expect(custom.days).toBe(15);

    const reversed = resolveReportRange(
      { rangeMode: 'custom', customFrom: '2026-10-20', customTo: '2026-10-10' },
      '2026-11-13'
    );
    expect(reversed.valid).toBe(false);
    expect(reversed.fromISO).toBe('2026-10-10');
    expect(reversed.toISO).toBe('2026-10-20');
  });
});

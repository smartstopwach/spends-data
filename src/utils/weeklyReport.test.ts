import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { DEFAULT_REPORT_CONFIG, isReportDue, isoWeekday, isValidEmail } from './reportConfig';
import { buildWeeklyReport } from './weeklyReport';

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
    expect(report.dailyRows).toHaveLength(7);
    expect(report.categories[0].label).toBe('Food & Chai');
    expect(report.walletBalance).toBe(-9499);
    expect(report.subject).toContain('GharKaHisaab');
    expect(report.text).toContain('Daily avg');
    expect(report.html).toContain('Weekly spend report');
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

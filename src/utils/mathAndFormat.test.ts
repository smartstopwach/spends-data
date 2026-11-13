import { describe, expect, it } from 'vitest';
import { createSampleTransactions } from '../constants';
import {
  evaluateAmountExpression,
  formatDisplayDate,
  formatINR,
  getDaysInMonth,
  getTodayISO,
  shiftISODate,
  shiftMonthKey,
} from './mathAndFormat';

describe('evaluateAmountExpression (Spend Calculator)', () => {
  it('parses plain amounts and Indian formatted strings', () => {
    expect(evaluateAmountExpression('5000')).toEqual({
      valid: true,
      value: 5000,
      isExpression: false,
    });
    expect(evaluateAmountExpression('₹12,500.50')).toEqual({
      valid: true,
      value: 12500.5,
      isExpression: false,
    });
  });

  it('evaluates multi-item daily spend expressions accurately', () => {
    const res = evaluateAmountExpression('40 + 25 + 60');
    expect(res.valid).toBe(true);
    expect(res.isExpression).toBe(true);
    expect(res.value).toBe(125);
  });

  it('supports multiplication, division, unicode operators, and parentheses', () => {
    expect(evaluateAmountExpression('(50 + 30) × 2').value).toBe(160);
    expect(evaluateAmountExpression('300 ÷ 4').value).toBe(75);
  });

  it('rejects zero, negative totals, division by zero, and malformed expressions', () => {
    expect(evaluateAmountExpression('0').valid).toBe(false);
    expect(evaluateAmountExpression('50 - 100').valid).toBe(false);
    expect(evaluateAmountExpression('100 / 0').valid).toBe(false);
    expect(evaluateAmountExpression('40 + ').valid).toBe(false);
    expect(evaluateAmountExpression('abc').valid).toBe(false);
  });
});

describe('formatINR & Date Helpers', () => {
  it('formats Indian numbering system with rupee symbol and optional sign', () => {
    expect(formatINR(8000)).toBe('₹8,000');
    expect(formatINR(8000, true)).toBe('+₹8,000');
    expect(formatINR(-140)).toBe('-₹140');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });

  it('shifts month keys across year boundaries cleanly', () => {
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(getDaysInMonth('2026-11')).toBe(30);
  });

  it('labels Today and Yesterday cleanly', () => {
    expect(formatDisplayDate('2026-11-13', '2026-11-13')).toBe('Today (Aaj)');
    expect(formatDisplayDate('2026-11-12', '2026-11-13')).toBe('Yesterday (Kal)');
  });
});

describe('Sample demo dataset & balance', () => {
  it('creates valid demo entries where balance = total ghar ka paisa - total spends', () => {
    const sample = createSampleTransactions(new Date(2026, 10, 13));
    expect(sample.length).toBeGreaterThan(5);
    expect(sample.every((t) => t.id.startsWith('demo-'))).toBe(true);

    const income = sample
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const spend = sample
      .filter((t) => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(income).toBe(10700);
    expect(spend).toBe(5008);
    expect(income - spend).toBe(5692);
  });
});

describe('shiftISODate (daily date handling)', () => {
  it('moves to yesterday and month/year boundaries correctly', () => {
    expect(shiftISODate('2026-11-13', -1)).toBe('2026-11-12');
    expect(shiftISODate('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftISODate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftISODate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftISODate('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('keeps today helpers consistent for a given reference date', () => {
    const now = new Date(2026, 10, 13, 23, 59);
    expect(getTodayISO(now)).toBe('2026-11-13');
    expect(shiftISODate(getTodayISO(now), -1)).toBe('2026-11-12');
  });
});

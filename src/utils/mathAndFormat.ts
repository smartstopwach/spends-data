import { ALL_CATEGORY_MAP } from '../constants';
import { MonthlyBudgets, Transaction } from '../types';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, showSign = false): string {
  const abs = Math.abs(amount);
  const formatted = inrFormatter.format(Math.round(abs * 100) / 100);
  if (amount < 0) return `-₹${formatted}`;
  if (showSign && amount > 0) return `+₹${formatted}`;
  return `₹${formatted}`;
}

export function getTodayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const dt = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'all') return 'All Time (Kul Hisaab)';
  const [yearStr, monthStr] = monthKey.split('-');
  const dt = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  return new Date(Number(yearStr), Number(monthStr), 0).getDate();
}

export function formatDisplayDate(dateStr: string, todayStr: string = getTodayISO()): string {
  if (dateStr === todayStr) return 'Today (Aaj)';
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const yesterday = new Date(ty, tm - 1, td - 1);
  const yStr = getTodayISO(yesterday);
  if (dateStr === yStr) return 'Yesterday (Kal)';

  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: y !== ty ? 'numeric' : undefined,
  });
}

/**
 * Safe recursive-descent math parser for amounts & spend calculations
 * Supports +, -, *, /, parentheses, decimals, commas, and ₹ symbol.
 */
export function evaluateAmountExpression(raw: string): {
  valid: boolean;
  value: number | null;
  isExpression: boolean;
  error?: string;
} {
  const cleaned = raw.replace(/[₹,\s]/g, '').replace(/×/g, '*').replace(/÷/g, '/');
  if (!cleaned) {
    return { valid: false, value: null, isExpression: false };
  }

  if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
    return {
      valid: false,
      value: null,
      isExpression: true,
      error: 'Sirf numbers aur + - * / use karein',
    };
  }

  const isExpression = /[+\-*/()]/.test(cleaned);

  let pos = 0;

  function parseExpression(): number {
    let val = parseTerm();
    while (pos < cleaned.length && (cleaned[pos] === '+' || cleaned[pos] === '-')) {
      const op = cleaned[pos++];
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(): number {
    let val = parseFactor();
    while (pos < cleaned.length && (cleaned[pos] === '*' || cleaned[pos] === '/')) {
      const op = cleaned[pos++];
      const right = parseFactor();
      if (op === '/') {
        if (right === 0) throw new Error('Zero se divide nahi ho sakta');
        val = val / right;
      } else {
        val = val * right;
      }
    }
    return val;
  }

  function parseFactor(): number {
    if (cleaned[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (cleaned[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (cleaned[pos] === '(') {
      pos++;
      const val = parseExpression();
      if (cleaned[pos] !== ')') throw new Error('Bracket close karein');
      pos++;
      return val;
    }

    const start = pos;
    let dotCount = 0;
    while (pos < cleaned.length && ((cleaned[pos] >= '0' && cleaned[pos] <= '9') || cleaned[pos] === '.')) {
      if (cleaned[pos] === '.') dotCount++;
      if (dotCount > 1) throw new Error('Invalid number');
      pos++;
    }
    if (start === pos) throw new Error('Incomplete expression');
    return Number(cleaned.slice(start, pos));
  }

  try {
    const result = parseExpression();
    if (pos !== cleaned.length || !Number.isFinite(result)) {
      return { valid: false, value: null, isExpression, error: 'Check calculation' };
    }
    const rounded = Math.round(result * 100) / 100;
    if (rounded <= 0) {
      return { valid: false, value: rounded, isExpression, error: 'Amount ₹0 se zyada hona chahiye' };
    }
    return { valid: true, value: rounded, isExpression };
  } catch (err) {
    return {
      valid: false,
      value: null,
      isExpression,
      error: err instanceof Error ? err.message : 'Invalid calculation',
    };
  }
}

export function exportTransactionsToCSV(transactions: Transaction[], filename = 'ghar-ka-hisaab.csv'): void {
  const headers = ['Date', 'Type', 'Category/Source', 'Amount (INR)', 'Signed Amount', 'Payment Mode', 'Note'];
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  const escapeCSV = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sorted.map((t) => {
    const meta = ALL_CATEGORY_MAP[t.category];
    const typeLabel = t.type === 'income' ? 'Ghar se Aaya (+)' : 'Spend (-)';
    const signed = t.type === 'income' ? t.amount : -t.amount;
    return [
      t.date,
      typeLabel,
      meta ? meta.label : t.category,
      t.amount,
      signed,
      t.paymentMode.toUpperCase(),
      t.note,
    ]
      .map(escapeCSV)
      .join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportBackupJSON(transactions: Transaction[], budgets: MonthlyBudgets): void {
  const payload = {
    app: 'GharKaHisaab',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    budgets,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `ghar-ka-hisaab-backup-${getTodayISO()}.json`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

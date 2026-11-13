import { ALL_CATEGORY_MAP } from '../constants';
import { Transaction } from '../types';
import { formatINR, getTodayISO, shiftISODate } from './mathAndFormat';

export type ReportRangeMode = 'last7' | 'last14' | 'thisMonth' | 'custom';

export interface ReportRange {
  fromISO: string;
  toISO: string;
}

export interface ReportRangeInfo extends ReportRange {
  mode: ReportRangeMode;
  days: number;
  label: string;
  valid: boolean;
}

export const RANGE_OPTIONS: Array<{ value: ReportRangeMode; label: string; hint: string }> = [
  { value: 'last7', label: 'Last 7 days', hint: 'Rolling week ending today' },
  { value: 'last14', label: 'Last 14 days', hint: 'Rolling fortnight ending today' },
  { value: 'thisMonth', label: 'This month', hint: '1st of this month until today' },
  { value: 'custom', label: 'Custom range', hint: 'Pick exact from / to dates' },
];

const diffDays = (fromISO: string, toISO: string): number => {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000) + 1;
};

/**
 * Turns the persisted config into a concrete from → to range for the digest.
 */
export function resolveReportRange(
  config: { rangeMode?: ReportRangeMode; customFrom?: string; customTo?: string },
  todayISO: string = getTodayISO()
): ReportRangeInfo {
  const mode: ReportRangeMode = config.rangeMode ?? 'last7';
  let fromISO = shiftISODate(todayISO, -6);
  let toISO = todayISO;
  let valid = true;

  if (mode === 'last14') {
    fromISO = shiftISODate(todayISO, -13);
  } else if (mode === 'thisMonth') {
    fromISO = `${todayISO.slice(0, 7)}-01`;
  } else if (mode === 'custom') {
    fromISO = config.customFrom || shiftISODate(todayISO, -6);
    toISO = config.customTo || todayISO;
    if (fromISO > toISO) {
      valid = false;
      [fromISO, toISO] = [toISO, fromISO];
    }
  }

  const days = Math.max(1, diffDays(fromISO, toISO));
  return {
    mode,
    fromISO,
    toISO,
    days,
    valid,
    label: `${shortDate(fromISO)} – ${shortDate(toISO)}`,
  };
}

export const shortDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const longDay = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export interface ReportEntryRow {
  id: string;
  date: string;
  note: string;
  category: string;
  color: string;
  mode: string;
  amount: number;
  type: 'income' | 'spend';
}

export interface ReportDayGroup {
  date: string;
  label: string;
  spend: number;
  income: number;
  items: ReportEntryRow[];
}

export interface Report {
  fromISO: string;
  toISO: string;
  periodLabel: string;
  days: number;
  income: number;
  spend: number;
  net: number;
  incomeCount: number;
  spendCount: number;
  entryCount: number;
  dailyAvg: number;
  topCategory: string | null;
  topCategoryAmount: number;
  categories: Array<{ label: string; amount: number; percentage: number; count: number; color: string }>;
  dayGroups: ReportDayGroup[];
  dailyRows: Array<{ date: string; label: string; spend: number; income: number; count: number }>;
  biggestSpend: ReportEntryRow | null;
  walletBalance: number;
  subject: string;
  text: string;
  html: string;
}

const MODE_LABEL: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank: 'Bank' };

/**
 * Builds an itemised spend digest for an explicit date range (inclusive).
 */
export function buildReport(
  transactions: Transaction[],
  range: ReportRange,
  walletTransactions: Transaction[] = transactions
): Report {
  const { fromISO, toISO } = range;

  const windowTx = transactions
    .filter((tx) => tx.date >= fromISO && tx.date <= toISO)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  let income = 0;
  let spend = 0;
  let incomeCount = 0;
  let spendCount = 0;
  const catTotals = new Map<string, { amount: number; count: number }>();
  const dayMap = new Map<string, ReportDayGroup>();
  let biggestSpend: ReportEntryRow | null = null;

  for (const tx of windowTx) {
    const meta = ALL_CATEGORY_MAP[tx.category];
    const row: ReportEntryRow = {
      id: tx.id,
      date: tx.date,
      note: tx.note || meta?.label || 'Entry',
      category: meta?.label ?? tx.category,
      color: meta?.color ?? '#64748b',
      mode: MODE_LABEL[tx.paymentMode] ?? tx.paymentMode,
      amount: tx.amount,
      type: tx.type,
    };

    let day = dayMap.get(tx.date);
    if (!day) {
      day = { date: tx.date, label: longDay(tx.date), spend: 0, income: 0, items: [] };
      dayMap.set(tx.date, day);
    }
    day.items.push(row);

    if (tx.type === 'income') {
      income += tx.amount;
      incomeCount += 1;
      day.income += tx.amount;
    } else {
      spend += tx.amount;
      spendCount += 1;
      day.spend += tx.amount;
      const prev = catTotals.get(tx.category) ?? { amount: 0, count: 0 };
      catTotals.set(tx.category, { amount: prev.amount + tx.amount, count: prev.count + 1 });
      if (!biggestSpend || tx.amount > biggestSpend.amount) biggestSpend = row;
    }
  }

  const categories = [...catTotals.entries()]
    .map(([category, stat]) => ({
      label: ALL_CATEGORY_MAP[category]?.label ?? category,
      color: ALL_CATEGORY_MAP[category]?.color ?? '#64748b',
      amount: Math.round(stat.amount * 100) / 100,
      percentage: spend > 0 ? Math.round((stat.amount / spend) * 1000) / 10 : 0,
      count: stat.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Newest day first, like the app ledger.
  const dayGroups = [...dayMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  const dailyRows: Report['dailyRows'] = dayGroups
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: d.date,
      label: d.label,
      spend: Math.round(d.spend * 100) / 100,
      income: Math.round(d.income * 100) / 100,
      count: d.items.length,
    }));

  const walletBalance =
    Math.round(
      walletTransactions.reduce(
        (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount),
        0
      ) * 100
    ) / 100;

  const days = Math.max(1, diffDays(fromISO, toISO));
  const periodLabel = `${shortDate(fromISO)} – ${shortDate(toISO)}`;
  const top = categories[0] ?? null;
  const net = Math.round((income - spend) * 100) / 100;
  const subject = `GharKaHisaab · spends ${formatINR(spend)} · ${periodLabel}`;

  /* ── Plain-text version ─────────────────────────────── */
  const textLines: string[] = [
    'GHARKAHISAAB — SPEND REPORT',
    periodLabel,
    '',
    'SUMMARY',
    `  Money in    ${formatINR(income)}  (${incomeCount} credits)`,
    `  Spends      ${formatINR(spend)}  (${spendCount} debits)`,
    `  Net         ${net >= 0 ? '+' : '-'}${formatINR(Math.abs(net))}`,
    `  Daily avg   ${formatINR(spend > 0 ? Math.round(spend / days) : 0)} (${days} days)`,
    `  Balance     ${formatINR(walletBalance)}`,
    '',
    'WHERE THE MONEY WENT',
    ...(categories.length
      ? categories.map(
          (c) => `  ${c.label.padEnd(24, '.')} ${formatINR(c.amount)}  (${c.percentage}%)`
        )
      : ['  No spends in this range']),
    '',
    'KARCHA KAISE HUA (day by day)',
  ];

  for (const day of dayGroups) {
    textLines.push(
      `  ${day.label}  —  spend ${formatINR(day.spend)}${
        day.income > 0 ? ` | in ${formatINR(day.income)}` : ''
      }`
    );
    for (const item of day.items) {
      textLines.push(
        `    ${item.type === 'income' ? '+' : '-'}${formatINR(item.amount).replace('₹', '₹')}  ${
          item.note
        }  [${item.category} · ${item.mode}]`
      );
    }
  }

  textLines.push('', `— Generated by GharKaHisaab · ${windowTx.length} entries`);
  const text = textLines.join('\n');

  /* ── HTML version ───────────────────────────────────── */
  const statCell = (label: string, value: string, color: string) => `
      <td style="padding:12px;background:#f8fafc;border-radius:10px;width:25%;vertical-align:top">
        <p style="margin:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;font-weight:700">${label}</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:${color}">${value}</p>
      </td>`;

  const categoryRowsHtml = categories.length
    ? categories
        .map(
          (c) => `
        <tr>
          <td style="padding:7px 0;vertical-align:middle">
            <span style="display:inline-block;width:7px;height:7px;border-radius:99px;background:${
              c.color
            };margin-right:7px"></span>
            <span style="font-size:12px;color:#334155;font-weight:600">${c.label}</span>
            <span style="font-size:10px;color:#a8b3c2">&nbsp;· ${c.count}</span>
          </td>
          <td style="width:110px;padding:7px 8px;vertical-align:middle">
            <div style="height:5px;background:#eef1f5;border-radius:99px;overflow:hidden">
              <div style="height:5px;width:${Math.max(3, c.percentage)}%;background:${
            c.color
          };border-radius:99px"></div>
            </div>
          </td>
          <td style="padding:7px 0;font-size:12px;color:#0f172a;font-weight:700;text-align:right;white-space:nowrap">
            ${formatINR(c.amount)} <span style="color:#a8b3c2;font-weight:600">${c.percentage}%</span>
          </td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="3" style="padding:8px 0;font-size:12px;color:#94a3b8">No spends recorded in this range 🎉</td></tr>';

  const ledgerHtml = dayGroups.length
    ? dayGroups
        .map((day) => {
          const items = day.items
            .map(
              (item) => `
              <tr>
                <td style="padding:8px 0;font-size:12px;color:#0f172a;font-weight:600">${escapeHtml(
                  item.note
                )}</td>
                <td style="padding:8px 6px;font-size:11px;color:#64748b;white-space:nowrap">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:99px;background:${
                    item.color
                  };margin-right:5px"></span>${escapeHtml(item.category)}
                </td>
                <td style="padding:8px 6px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap">${
                  item.mode
                }</td>
                <td style="padding:8px 0;font-size:12px;font-weight:700;text-align:right;white-space:nowrap;color:${
                  item.type === 'income' ? '#059669' : '#0f172a'
                }">
                  ${item.type === 'income' ? '+' : '−'}${formatINR(item.amount)}
                </td>
              </tr>`
            )
            .join('');

          return `
          <tr>
            <td colspan="4" style="padding:10px 0 4px">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f6">
                <tr>
                  <td style="padding:8px 0 2px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b">
                    ${day.label}
                  </td>
                  <td style="padding:8px 0 2px;text-align:right;font-size:10px;font-weight:700;color:#94a3b8;white-space:nowrap">
                    ${day.spend > 0 ? `spend −${formatINR(day.spend)}` : ''}
                    ${day.income > 0 ? ` · in +${formatINR(day.income)}` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${items}`
        })
        .join('')
    : `<tr><td colspan="4" style="padding:14px 0;font-size:12px;color:#94a3b8;text-align:center">No entries between ${periodLabel}</td></tr>`;

  const html = `
  <div style="font-family:Inter,-apple-system,'Segoe UI',Roboto,sans-serif;background:#eef1f6;padding:24px 12px">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ef;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:24px;color:#fff">
        <p style="margin:0;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#c7d2fe;font-weight:700">GharKaHisaab · Spend Report</p>
        <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;letter-spacing:-.02em">${periodLabel}</h1>
        <p style="margin:6px 0 0;font-size:12px;color:#c7d2fe">${days} days · ${
    windowTx.length
  } entries · spends ${formatINR(spend)}</p>
      </div>

      <div style="padding:20px 24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:6px 0;margin-bottom:22px">
          <tr>
            ${statCell('Money in', formatINR(income), '#059669')}
            ${statCell('Spends', formatINR(spend), '#0f172a')}
            ${statCell('Net', `${net >= 0 ? '+' : '−'}${formatINR(Math.abs(net))}`, net >= 0 ? '#4f46e5' : '#e11d48')}
            ${statCell('Balance', formatINR(walletBalance), '#334155')}
          </tr>
        </table>

        <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8">Where the money went</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${categoryRowsHtml}</table>

        <p style="margin:24px 0 4px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8">Karcha kaise hua — day by day</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr style="background:#f8fafc">
            <td style="padding:7px 8px;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Description</td>
            <td style="padding:7px 6px;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Category</td>
            <td style="padding:7px 6px;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Mode</td>
            <td style="padding:7px 8px;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;text-align:right">Amount</td>
          </tr>
          ${ledgerHtml}
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px">
          <tr>
            <td style="padding:12px 8px;background:#f1f5f9;border-radius:10px 0 0 10px;font-size:11px;font-weight:700;color:#475569">
              Total spends · ${spendCount} entries
            </td>
            <td style="padding:12px 8px;background:#f1f5f9;border-radius:0 10px 10px 0;font-size:14px;font-weight:800;color:#0f172a;text-align:right;white-space:nowrap">
              ${formatINR(spend)}
            </td>
          </tr>
        </table>

        ${
          top
            ? `<p style="margin:16px 0 0;font-size:11px;color:#64748b">Biggest category <strong style="color:#0f172a">${
                top.label
              }</strong> · ${formatINR(top.amount)} · daily average ${formatINR(
                spend > 0 ? Math.round(spend / days) : 0
              )}</p>`
            : ''
        }
        ${
          biggestSpend
            ? `<p style="margin:4px 0 0;font-size:11px;color:#64748b">Biggest single spend <strong style="color:#0f172a">${escapeHtml(
                biggestSpend.note
              )}</strong> · ${formatINR(biggestSpend.amount)}</p>`
            : ''
        }
      </div>

      <div style="padding:14px 24px;border-top:1px solid #eef2f6;font-size:10px;color:#a8b3c2;line-height:1.6">
        Sent by GharKaHisaab · generated ${shortDate(toISO)}. Your data stays in your browser unless you export or email it.
      </div>
    </div>
  </div>`;

  return {
    fromISO,
    toISO,
    periodLabel,
    days,
    income: Math.round(income * 100) / 100,
    spend: Math.round(spend * 100) / 100,
    net,
    incomeCount,
    spendCount,
    entryCount: windowTx.length,
    dailyAvg: spend > 0 ? Math.round(spend / days) : 0,
    topCategory: top?.label ?? null,
    topCategoryAmount: top?.amount ?? 0,
    categories,
    dayGroups,
    dailyRows,
    biggestSpend,
    walletBalance,
    subject,
    text,
    html,
  };
}

/** Convenience wrapper: last 7 days ending today. */
export function buildWeeklyReport(
  transactions: Transaction[],
  todayISO: string = getTodayISO(),
  range: ReportRange = { fromISO: shiftISODate(todayISO, -6), toISO: todayISO }
): Report {
  return buildReport(transactions, range);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface EmailJSDelivery {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

/** Sends the digest through EmailJS (browser-only, no backend needed). */
export async function sendReportViaEmailJS(
  report: Report,
  toEmail: string,
  creds: EmailJSDelivery
): Promise<void> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: creds.serviceId,
      template_id: creds.templateId,
      user_id: creds.publicKey,
      template_params: {
        to_email: toEmail,
        subject: report.subject,
        period: report.periodLabel,
        money_in: formatINR(report.income),
        spends: formatINR(report.spend),
        balance: formatINR(report.walletBalance),
        daily_avg: formatINR(report.dailyAvg),
        top_category: report.topCategory ?? '—',
        entries: String(report.entryCount),
        message: report.html,
        message_text: report.text,
        reply_to: toEmail,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`EmailJS ${res.status}: ${detail.slice(0, 160)}`);
  }
}

/** Opens Gmail compose pre-filled with the digest. */
export function openGmailCompose(report: Report, toEmail: string): void {
  const url =
    'https://mail.google.com/mail/?view=cm&fs=1' +
    `&to=${encodeURIComponent(toEmail)}` +
    `&su=${encodeURIComponent(report.subject)}` +
    `&body=${encodeURIComponent(report.text)}`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}

/** Fallback mailto (works for any mail app / account). */
export function openMailto(report: Report, toEmail: string): void {
  const url = `mailto:${toEmail}?subject=${encodeURIComponent(
    report.subject
  )}&body=${encodeURIComponent(report.text)}`;
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

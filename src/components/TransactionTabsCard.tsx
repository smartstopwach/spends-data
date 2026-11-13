import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CalendarDays,
  Inbox,
  List,
  Search,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { ALL_CATEGORY_MAP } from '../constants';
import { SpendCategory, Transaction } from '../types';
import { formatDisplayDate, formatINR, getTodayISO, shiftISODate } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

type TransactionTab = 'all' | 'spend' | 'income';

interface TransactionTabsCardProps {
  transactions: Transaction[];
  selectedCategory: SpendCategory | 'all';
  onClearCategory: () => void;
  onDelete: (id: string) => void;
  onLoadDemo: () => void;
  totalOverallCount: number;
  monthLabel: string;
}

const TABS: Array<{ id: TransactionTab; label: string }> = [
  { id: 'all', label: 'All Activity' },
  { id: 'spend', label: 'Spends' },
  { id: 'income', label: 'Money in' },
];

const MODE_LABEL: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank: 'Bank' };
const PAGE_SIZE = 12;

const dayHeading = (date: string): string => {
  const today = getTodayISO();
  if (date === today) return 'Today';
  if (date === shiftISODate(today, -1)) return 'Yesterday';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: y !== Number(today.slice(0, 4)) ? 'numeric' : undefined,
  });
};

const RecordRow: React.FC<{
  tx: Transaction;
  onDelete: (id: string) => void;
  showDate?: boolean;
}> = ({ tx, onDelete, showDate = false }) => {
  const meta = ALL_CATEGORY_MAP[tx.category];
  const isIncome = tx.type === 'income';

  return (
    <li
      className={`group grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3 transition-colors hover:bg-slate-50/80 sm:gap-3 sm:px-4 sm:py-2.5 lg:px-5 ${
        showDate
          ? 'lg:grid-cols-[92px_1fr_130px_104px_96px_36px]'
          : 'lg:grid-cols-[1fr_130px_104px_96px_36px]'
      }`}
    >
      {showDate && (
        <span className="num hidden text-[11px] font-medium text-slate-500 lg:block">
          {formatDisplayDate(tx.date)}
        </span>
      )}

      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            meta?.bgClass ?? 'bg-slate-100'
          } ${meta?.textClass ?? 'text-slate-600'}`}
        >
          <CategoryIcon name={meta?.iconName ?? 'MoreHorizontal'} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">
            {tx.note || meta?.label || 'Entry'}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-400 lg:hidden">
            {meta?.label ?? tx.category} · {MODE_LABEL[tx.paymentMode] ?? tx.paymentMode}
          </p>
        </div>
      </div>

      <span className="hidden truncate text-[11px] font-semibold text-slate-500 lg:block">
        {meta?.label ?? tx.category}
      </span>

      <span className="hidden lg:block">
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {MODE_LABEL[tx.paymentMode] ?? tx.paymentMode}
        </span>
      </span>

      <span
        className={`num text-right text-[13px] font-bold ${
          isIncome ? 'text-emerald-600' : 'text-slate-900'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatINR(tx.amount)}
      </span>

      <span className="flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(tx.id)}
          aria-label="Delete entry"
          title="Delete"
          className="rounded-md p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 active:bg-rose-50 active:text-rose-600 lg:p-1.5 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </span>
    </li>
  );
};

export const TransactionTabsCard: React.FC<TransactionTabsCardProps> = React.memo(
  ({
    transactions,
    selectedCategory,
    onClearCategory,
    onDelete,
    onLoadDemo,
    totalOverallCount,
    monthLabel,
  }) => {
    const [tab, setTab] = useState<TransactionTab>('all');
    const [query, setQuery] = useState('');
    const [sortDesc, setSortDesc] = useState(true);
    const [grouped, setGrouped] = useState(true);
    const [limit, setLimit] = useState(PAGE_SIZE);

    const counts = useMemo(() => {
      let spend = 0;
      let income = 0;
      for (const tx of transactions) {
        if (tx.type === 'spend') spend += 1;
        else income += 1;
      }
      return { all: transactions.length, spend, income };
    }, [transactions]);

    const rows = useMemo(() => {
      const q = query.trim().toLowerCase();
      return transactions
        .filter((tx) => {
          if (tab !== 'all' && tx.type !== tab) return false;
          if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
          if (!q) return true;
          const meta = ALL_CATEGORY_MAP[tx.category];
          return (
            (tx.note || '').toLowerCase().includes(q) ||
            (meta?.label || '').toLowerCase().includes(q) ||
            String(tx.amount).includes(q)
          );
        })
        .sort((a, b) => {
          const byDate = a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
          return sortDesc ? -byDate : byDate;
        });
    }, [transactions, tab, selectedCategory, query, sortDesc]);

    const visible = rows.slice(0, limit);

    /** Day-wise buckets (in current sort order) for the visible window. */
    const dayGroups = useMemo(() => {
      const groups: Array<{
        date: string;
        items: Transaction[];
        income: number;
        spend: number;
      }> = [];
      for (const tx of visible) {
        let bucket = groups[groups.length - 1];
        if (!bucket || bucket.date !== tx.date) {
          bucket = { date: tx.date, items: [], income: 0, spend: 0 };
          groups.push(bucket);
        }
        bucket.items.push(tx);
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.spend += tx.amount;
      }
      return groups;
    }, [visible]);

    const handleTab = (next: TransactionTab) => {
      setTab(next);
      setLimit(PAGE_SIZE);
    };

    return (
      <section aria-label="Transactions" className="panel overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-slate-200/80 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent entries</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {monthLabel} · {rows.length} {rows.length === 1 ? 'record' : 'records'}
              {grouped && dayGroups.length > 0 ? ` · ${dayGroups.length} days` : ''}
            </p>
          </div>

          <label className="relative flex w-full items-center sm:w-auto">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Search note or amount"
              className="field !py-1.5 !pl-8 text-xs sm:!w-[220px]"
              aria-label="Search transactions"
            />
          </label>
        </div>

        {/* Tab bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/60 px-2 py-2 sm:flex-wrap sm:px-3">
          <div role="tablist" aria-label="Transaction filters" className="chip-row flex min-w-0 items-center gap-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => handleTab(t.id)}
                  className={`relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    active
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`num rounded px-1 py-px text-[10px] font-bold ${
                      active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setGrouped((g) => !g)}
              title="Toggle day-wise grouping"
              className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                grouped
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                  : 'text-slate-400 hover:bg-white hover:text-slate-700'
              }`}
            >
              {grouped ? <CalendarDays className="h-3 w-3" /> : <List className="h-3 w-3" />}
              <span className="hidden sm:inline">{grouped ? 'Day-wise' : 'Flat list'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSortDesc((s) => !s)}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              title="Toggle sort order"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="hidden sm:inline">{sortDesc ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Active category filter */}
        {selectedCategory !== 'all' && (
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-amber-50/60 px-5 py-2">
            <span className="text-[11px] font-semibold text-amber-800">
              Filtered: {ALL_CATEGORY_MAP[selectedCategory]?.label ?? selectedCategory}
            </span>
            <button
              type="button"
              onClick={onClearCategory}
              className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
            >
              Clear
            </button>
          </div>
        )}

        {/* Body */}
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No records found</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {query || selectedCategory !== 'all'
                ? 'Try a different tab, search term or clear the filter.'
                : 'Add your first entry to get started.'}
            </p>
            {totalOverallCount === 0 && (
              <button
                type="button"
                onClick={onLoadDemo}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Load sample data
              </button>
            )}
          </div>
        ) : grouped ? (
          /* ── Day-wise groups with per-day totals ── */
          <div>
            {dayGroups.map((group) => {
              const net = Math.round((group.income - group.spend) * 100) / 100;
              return (
                <div key={group.date}>
                  <div className="flex items-center justify-between gap-2 border-y border-slate-100 bg-slate-50/70 px-4 py-1.5 lg:px-5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500">
                      <CalendarDays className="h-3 w-3 text-slate-400" />
                      {dayHeading(group.date)}
                      <span className="num font-medium normal-case tracking-normal text-slate-400">
                        · {group.items.length}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold">
                      {group.income > 0 && (
                        <span className="num text-emerald-600">+{formatINR(group.income)}</span>
                      )}
                      {group.spend > 0 && (
                        <span className="num text-slate-600">−{formatINR(group.spend)}</span>
                      )}
                      <span
                        className={`num rounded px-1.5 py-0.5 ${
                          net >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        net {net >= 0 ? '+' : '−'}
                        {formatINR(Math.abs(net))}
                      </span>
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {group.items.map((tx) => (
                      <RecordRow key={tx.id} tx={tx} onDelete={onDelete} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Flat list with a date column ── */
          <>
            <div className="hidden grid-cols-[92px_1fr_130px_104px_96px_36px] items-center gap-3 border-b border-slate-200/80 bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:grid">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span>Mode</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            <ul className="divide-y divide-slate-100">
              {visible.map((tx) => (
                <RecordRow key={tx.id} tx={tx} onDelete={onDelete} showDate />
              ))}
            </ul>
          </>
        )}

        {rows.length > visible.length && (
          <div className="border-t border-slate-200/80 px-5 py-3 text-center">
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Show {Math.min(PAGE_SIZE, rows.length - visible.length)} more
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/60 px-5 py-2.5 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-slate-400" />
            Saved locally in this browser
          </span>
          <span className="num">
            Showing {visible.length} of {rows.length}
          </span>
        </div>
      </section>
    );
  }
);
TransactionTabsCard.displayName = 'TransactionTabsCard';

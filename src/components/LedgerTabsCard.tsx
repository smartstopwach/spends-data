import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Inbox,
  Search,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { ALL_CATEGORY_MAP } from '../constants';
import { SpendCategory, Transaction } from '../types';
import { formatDisplayDate, formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

type LedgerTab = 'all' | 'spend' | 'income';

interface LedgerTabsCardProps {
  transactions: Transaction[];
  selectedCategory: SpendCategory | 'all';
  onClearCategory: () => void;
  onDelete: (id: string) => void;
  onLoadDemo: () => void;
  totalOverallCount: number;
  monthLabel: string;
}

const TABS: Array<{ id: LedgerTab; label: string }> = [
  { id: 'all', label: 'All Activity' },
  { id: 'spend', label: 'Spends' },
  { id: 'income', label: 'Ghar Se' },
];

const MODE_LABEL: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank: 'Bank' };

const PAGE_SIZE = 12;

export const LedgerTabsCard: React.FC<LedgerTabsCardProps> = React.memo(
  ({
    transactions,
    selectedCategory,
    onClearCategory,
    onDelete,
    onLoadDemo,
    totalOverallCount,
    monthLabel,
  }) => {
    const [tab, setTab] = useState<LedgerTab>('all');
    const [query, setQuery] = useState('');
    const [sortDesc, setSortDesc] = useState(true);
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

    const handleTab = (next: LedgerTab) => {
      setTab(next);
      setLimit(PAGE_SIZE);
    };

    return (
      <section aria-label="Transaction ledger" className="panel overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Hisaab</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {monthLabel} · {rows.length} {rows.length === 1 ? 'record' : 'records'}
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
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/60 px-3 py-2">
          <div role="tablist" aria-label="Ledger filters" className="flex items-center gap-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => handleTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`num rounded px-1 py-px text-[10px] font-bold ${
                      active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSortDesc((s) => !s)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span className="hidden sm:inline">{sortDesc ? 'Newest' : 'Oldest'}</span>
          </button>
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

        {/* Table */}
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No records found</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {query || selectedCategory !== 'all'
                ? 'Try a different tab, search term or clear the filter.'
                : 'Add your first entry to start the ledger.'}
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
        ) : (
          <>
            {/* Column header (desktop) */}
            <div className="hidden grid-cols-[92px_1fr_130px_104px_84px_40px] items-center gap-3 border-b border-slate-200/80 bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 md:grid">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span>Mode</span>
              <span className="text-right">Amount</span>
              <span />
            </div>

            <ul className="divide-y divide-slate-100">
              {visible.map((tx) => {
                const meta = ALL_CATEGORY_MAP[tx.category];
                const isIncome = tx.type === 'income';
                return (
                  <li
                    key={tx.id}
                    className="group grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 md:grid-cols-[92px_1fr_130px_104px_84px_40px] md:px-5"
                  >
                    <span className="num order-2 hidden text-[11px] font-medium text-slate-500 md:order-none md:block">
                      {formatDisplayDate(tx.date)}
                    </span>

                    <div className="order-1 flex min-w-0 items-center gap-2.5 md:order-none">
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
                        <p className="truncate text-[11px] font-medium text-slate-400 md:hidden">
                          {meta?.label ?? tx.category} · {formatDisplayDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    <span className="order-3 hidden truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 md:order-none md:inline-block md:bg-transparent md:px-0 md:py-0">
                      {meta?.label ?? tx.category}
                    </span>

                    <span className="order-4 hidden md:order-none md:block">
                      <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {MODE_LABEL[tx.paymentMode] ?? tx.paymentMode}
                      </span>
                    </span>

                    <span
                      className={`num order-2 text-right text-[13px] font-bold md:order-none ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatINR(tx.amount).replace('₹', '₹')}
                    </span>

                    <span className="order-5 flex justify-end md:order-none">
                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        aria-label="Delete entry"
                        title="Delete"
                        className="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>

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
          </>
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
LedgerTabsCard.displayName = 'LedgerTabsCard';

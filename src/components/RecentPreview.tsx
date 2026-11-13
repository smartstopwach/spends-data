import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { ALL_CATEGORY_MAP } from '../constants';
import { Transaction } from '../types';
import { formatDisplayDate, formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface RecentPreviewProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

const PREVIEW_COUNT = 4;

export const RecentPreview: React.FC<RecentPreviewProps> = React.memo(
  ({ transactions, onViewAll }) => {
    const latest = useMemo(
      () =>
        [...transactions]
          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
          .slice(0, PREVIEW_COUNT),
      [transactions]
    );

    return (
      <section aria-label="Latest entries preview" className="panel p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Latest Activity</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Last {latest.length || 0} of {transactions.length} entries
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700"
          >
            View all transactions
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {latest.length === 0 ? (
          <p className="py-6 text-center text-xs font-medium text-slate-500">
            No entries yet — add your first one from the New Entry panel.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {latest.map((tx) => {
              const meta = ALL_CATEGORY_MAP[tx.category];
              const isIncome = tx.type === 'income';
              return (
                <li key={tx.id} className="flex items-center gap-2.5 py-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      meta?.bgClass ?? 'bg-slate-100'
                    } ${meta?.textClass ?? 'text-slate-600'}`}
                  >
                    <CategoryIcon name={meta?.iconName ?? 'MoreHorizontal'} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-900">
                      {tx.note || meta?.label || 'Entry'}
                    </p>
                    <p className="truncate text-[10px] font-medium text-slate-400">
                      {meta?.label ?? tx.category} · {formatDisplayDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className={`num shrink-0 text-[12px] font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '−'}
                    {formatINR(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }
);
RecentPreview.displayName = 'RecentPreview';

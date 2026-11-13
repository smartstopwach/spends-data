import React, { useMemo, useState } from 'react';
import { Sparkles, Trash2, Wallet } from 'lucide-react';
import { ALL_CATEGORY_MAP } from '../constants';
import { SpendCategory, Transaction } from '../types';
import { formatDisplayDate, formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface HistoryCardProps {
  transactions: Transaction[];
  selectedCategory: SpendCategory | 'all';
  onDelete: (id: string) => void;
  onLoadDemo: () => void;
  totalOverallCount: number;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  transactions,
  selectedCategory,
  onDelete,
  onLoadDemo,
  totalOverallCount,
}) => {
  const [filter, setFilter] = useState<'all' | 'spend' | 'income'>('all');

  const visibleItems = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (filter !== 'all' && tx.type !== filter) return false;
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [transactions, filter, selectedCategory]);

  return (
    <section
      aria-label="Recent Transactions"
      className="rounded-[28px] bg-white border border-black/[0.06] p-6 sm:p-7 aesthetic-card"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900">Recent Hisaab</h2>
          <p className="text-xs text-zinc-400 font-medium">
            {visibleItems.length} {visibleItems.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="inline-flex p-1 rounded-full bg-zinc-100">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'spend', label: 'Spends' },
              { id: 'income', label: 'Ghar Se' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                filter === t.id
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-zinc-700">Abhi koi entry nahi hai</p>
          <p className="text-xs text-zinc-400 mt-1">
            Upar card se Ghar ka Paisa (+) ya Spend (-) add karein
          </p>
          {totalOverallCount === 0 && (
            <button
              type="button"
              onClick={onLoadDemo}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Try Sample Cards</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleItems.map((tx) => {
            const meta = ALL_CATEGORY_MAP[tx.category] || {
              label: tx.category,
              bgClass: 'bg-zinc-100',
              textClass: 'text-zinc-700',
              iconName: 'MoreHorizontal',
            };
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-100 transition group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.bgClass} ${meta.textClass}`}
                  >
                    <CategoryIcon name={meta.iconName} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {tx.note || meta.label}
                    </p>
                    <p className="text-xs font-medium text-zinc-400 mt-0.5">
                      {meta.label} • {formatDisplayDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm sm:text-base font-extrabold tabular-nums ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 rounded-xl text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

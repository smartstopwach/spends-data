import React, { useMemo, useState } from 'react';
import {
  Pencil,
  ReceiptText,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ALL_CATEGORY_MAP } from '../constants';
import { NewTransactionInput } from '../hooks/useSpendsStore';
import { PaymentMode, SpendCategory, Transaction } from '../types';
import { formatDisplayDate, formatINR } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionListProps {
  transactions: Transaction[];
  selectedCategoryFilter: SpendCategory | 'all';
  onClearCategoryFilter: () => void;
  onUpdate: (id: string, updates: Partial<NewTransactionInput>) => void;
  onDelete: (id: string) => void;
  onLoadDemo: () => void;
  totalOverallCount: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedCategoryFilter,
  onClearCategoryFilter,
  onUpdate,
  onDelete,
  onLoadDemo,
  totalOverallCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'spend' | 'income'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | PaymentMode>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (modeFilter !== 'all' && tx.paymentMode !== modeFilter) return false;
        if (selectedCategoryFilter !== 'all' && tx.category !== selectedCategoryFilter) {
          return false;
        }
        if (q) {
          const meta = ALL_CATEGORY_MAP[tx.category];
          const haystack = `${tx.note} ${meta?.label || ''} ${tx.paymentMode} ${tx.amount}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [transactions, typeFilter, modeFilter, selectedCategoryFilter, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { date: string; items: Transaction[]; daySpend: number; dayIncome: number }
    >();
    for (const tx of filtered) {
      let group = map.get(tx.date);
      if (!group) {
        group = { date: tx.date, items: [], daySpend: 0, dayIncome: 0 };
        map.set(tx.date, group);
      }
      group.items.push(tx);
      if (tx.type === 'spend') group.daySpend += tx.amount;
      else group.dayIncome += tx.amount;
    }
    return Array.from(map.values());
  }, [filtered]);

  const filteredTotals = useMemo(() => {
    let inc = 0;
    let spd = 0;
    for (const tx of filtered) {
      if (tx.type === 'income') inc += tx.amount;
      else spd += tx.amount;
    }
    return { inc, spd };
  }, [filtered]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header + Filters */}
      <div className="p-5 border-b border-slate-100 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">
              Transactions & Hisaab History
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tabular-nums">
              {filtered.length}
            </span>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
              {filteredTotals.inc > 0 && (
                <span className="text-emerald-600">+{formatINR(filteredTotals.inc)}</span>
              )}
              {filteredTotals.spd > 0 && (
                <span className="text-rose-600">-{formatINR(filteredTotals.spd)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search note, auto, chai, rent..."
              className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'spend', label: 'Spends (-)' },
                { id: 'income', label: 'Ghar (+)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'all' | PaymentMode)}
            aria-label="Filter by payment mode"
            className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Modes</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>

        {/* Active Category Pill */}
        {selectedCategoryFilter !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Category filter:</span>
            <button
              type="button"
              onClick={onClearCategoryFilter}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 cursor-pointer"
            >
              <span>{ALL_CATEGORY_MAP[selectedCategoryFilter]?.label || selectedCategoryFilter}</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Grouped List */}
      {grouped.length === 0 ? (
        <div className="py-14 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ReceiptText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Koi entry nahi mili</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {totalOverallCount === 0
              ? 'Apna pehla "Ghar se Paisa (+)" ya "Spend (-)" add karein, ya demo entries load karke app try karein.'
              : 'Is mahine ya filter mein koi transaction nahi hai.'}
          </p>
          {totalOverallCount === 0 && (
            <button
              type="button"
              onClick={onLoadDemo}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Hisaab (Demo)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {grouped.map((group) => (
            <div key={group.date}>
              {/* Day Header */}
              <div className="px-5 py-2.5 bg-slate-50/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {formatDisplayDate(group.date)}
                </span>
                <div className="flex items-center gap-2.5 font-semibold tabular-nums">
                  {group.dayIncome > 0 && (
                    <span className="text-emerald-600">+{formatINR(group.dayIncome)}</span>
                  )}
                  {group.daySpend > 0 && (
                    <span className="text-slate-600">Spent {formatINR(group.daySpend)}</span>
                  )}
                </div>
              </div>

              {/* Day Items */}
              <div className="divide-y divide-slate-100/80">
                {group.items.map((tx) => {
                  const meta = ALL_CATEGORY_MAP[tx.category] || {
                    label: tx.category,
                    bgClass: 'bg-slate-100',
                    textClass: 'text-slate-700',
                    iconName: 'MoreHorizontal',
                  };
                  const isInc = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bgClass} ${meta.textClass}`}
                        >
                          <CategoryIcon name={meta.iconName} className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {tx.note || meta.label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>{meta.label}</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {tx.paymentMode}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-sm sm:text-base font-bold tabular-nums ${
                            isInc ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isInc ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                        </span>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Edit entry"
                            aria-label="Edit entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete entry"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={onUpdate}
        />
      )}
    </div>
  );
};

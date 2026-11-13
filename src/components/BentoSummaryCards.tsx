import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatINR } from '../utils/mathAndFormat';

interface BentoSummaryCardsProps {
  walletBalance: number;
  periodIncome: number;
  periodSpend: number;
  incomeCount: number;
  spendCount: number;
  dailyAvgSpend: number;
  onQuickAdd: (mode: 'income' | 'spend') => void;
}

export const BentoSummaryCards: React.FC<BentoSummaryCardsProps> = React.memo(
  ({
    walletBalance,
    periodIncome,
    periodSpend,
    incomeCount,
    spendCount,
    dailyAvgSpend,
    onQuickAdd,
  }) => {
    const remainingPct =
      periodIncome > 0
        ? Math.max(
            0,
            Math.min(100, Math.round(((periodIncome - periodSpend) / periodIncome) * 100))
          )
        : walletBalance > 0
        ? 100
        : 0;

    return (
      <section
        aria-label="Money Summary Cards"
        className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
      >
        {/* 1. Luxe Dark Wallet Card (Full width on mobile, 1st col on desktop) */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-3xl bg-[#16181A] text-white p-5 sm:p-6 shadow-[0_14px_34px_-10px_rgba(22,24,26,0.32)] flex flex-col justify-between">
          <div className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-emerald-400/15 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Abhi Bacha Paisa</span>
              </div>
              <p
                className={`mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
                  walletBalance < 0 ? 'text-rose-300' : 'text-white'
                }`}
              >
                {formatINR(walletBalance)}
              </p>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-emerald-300 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="relative mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span>Ghar ka paisa − Spends</span>
              {periodIncome > 0 && (
                <span className="font-bold text-emerald-300 tabular-nums">
                  {remainingPct}% safe
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                style={{ width: `${remainingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Ghar Se Aaya Pastel Card */}
        <div className="col-span-1 rounded-3xl bg-gradient-to-br from-emerald-50/95 via-emerald-50/40 to-white border border-emerald-200/75 p-4 sm:p-6 shadow-[0_6px_20px_-6px_rgba(5,150,105,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">Ghar Se</span>
            </span>

            <button
              type="button"
              onClick={() => onQuickAdd('income')}
              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0"
            >
              + Add
            </button>
          </div>

          <div className="mt-4 sm:mt-5">
            <p className="text-xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums truncate">
              {formatINR(periodIncome, true)}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-medium text-emerald-900/60 truncate">
              {incomeCount} {incomeCount === 1 ? 'transfer' : 'transfers'} added
            </p>
          </div>
        </div>

        {/* 3. Total Spends Pastel Card */}
        <div className="col-span-1 rounded-3xl bg-gradient-to-br from-rose-50/95 via-orange-50/35 to-white border border-rose-200/75 p-4 sm:p-6 shadow-[0_6px_20px_-6px_rgba(225,29,72,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">Spends</span>
            </span>

            <button
              type="button"
              onClick={() => onQuickAdd('spend')}
              className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0"
            >
              - Spend
            </button>
          </div>

          <div className="mt-4 sm:mt-5">
            <p className="text-xl sm:text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums truncate">
              {periodSpend > 0 ? `-${formatINR(periodSpend)}` : '₹0'}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-medium text-rose-950/60 tabular-nums truncate">
              {spendCount > 0 ? `Avg ${formatINR(dailyAvgSpend)}/day` : 'No spends yet'}
            </p>
          </div>
        </div>
      </section>
    );
  }
);
BentoSummaryCards.displayName = 'BentoSummaryCards';

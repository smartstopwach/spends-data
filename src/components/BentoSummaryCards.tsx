import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles, Wallet } from 'lucide-react';
import { formatINR } from '../utils/mathAndFormat';

interface BentoSummaryCardsProps {
  walletBalance: number;
  periodIncome: number;
  periodSpend: number;
  dailyAvgSpend: number;
  onQuickAdd: (mode: 'income' | 'spend') => void;
}

export const BentoSummaryCards: React.FC<BentoSummaryCardsProps> = ({
  walletBalance,
  periodIncome,
  periodSpend,
  dailyAvgSpend,
  onQuickAdd,
}) => {
  const remainingPct =
    periodIncome > 0
      ? Math.max(0, Math.min(100, Math.round(((periodIncome - periodSpend) / periodIncome) * 100)))
      : walletBalance > 0
      ? 100
      : 0;

  return (
    <section aria-label="Money Summary Cards" className="space-y-4">
      {/* 1. Luxe Dark Hero Wallet Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 text-white p-7 sm:p-8 shadow-[0_18px_40px_-12px_rgba(24,24,27,0.35)]">
        {/* Soft ambient glow */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Abhi Bacha Paisa
            </span>
            <p
              className={`mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums ${
                walletBalance < 0 ? 'text-rose-300' : 'text-white'
              }`}
            >
              {formatINR(walletBalance)}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 text-emerald-300 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Sleek Balance Bar */}
        <div className="relative mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
            <span>Ghar se aaya − Spends = Remaining</span>
            {periodIncome > 0 && (
              <span className="font-semibold text-emerald-300 tabular-nums">
                {remainingPct}% safe
              </span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${remainingPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Pastel Aesthetic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ghar Se Aaya Card */}
        <div className="rounded-[26px] bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/70 p-6 aesthetic-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Ghar Se Aaya
            </span>
            <button
              type="button"
              onClick={() => onQuickAdd('income')}
              className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              + Paisa Add
            </button>
          </div>

          <div className="mt-5">
            <p className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {formatINR(periodIncome, true)}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-800/70">
              Ghar se jo paisa aaya wo yahan judta hai
            </p>
          </div>
        </div>

        {/* Spends Card */}
        <div className="rounded-[26px] bg-gradient-to-br from-rose-50/90 via-orange-50/40 to-white border border-rose-200/70 p-6 aesthetic-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100/80 px-3 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Total Spends
            </span>
            <button
              type="button"
              onClick={() => onQuickAdd('spend')}
              className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              - Spend Add
            </button>
          </div>

          <div className="mt-5">
            <p className="text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
              {periodSpend > 0 ? `-${formatINR(periodSpend)}` : '₹0'}
            </p>
            <p className="mt-1 text-xs font-medium text-rose-900/65 tabular-nums">
              Roz ka average: <strong>{formatINR(dailyAvgSpend)}/day</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

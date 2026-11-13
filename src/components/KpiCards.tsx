import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Landmark, Scale } from 'lucide-react';
import { formatINR } from '../utils/mathAndFormat';

interface KpiCardsProps {
  walletBalance: number;
  periodIncome: number;
  periodSpend: number;
  incomeCount: number;
  spendCount: number;
  dailyAvgSpend: number;
  safeDailyAllowance: number;
  onQuickAdd: (mode: 'income' | 'spend') => void;
}

const TrendPill: React.FC<{ label: string; tone: 'up' | 'down' | 'flat' }> = ({ label, tone }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
      tone === 'up'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'down'
        ? 'bg-rose-50 text-rose-600'
        : 'bg-slate-100 text-slate-600'
    }`}
  >
    {tone === 'up' ? (
      <ArrowDownLeft className="h-2.5 w-2.5" />
    ) : tone === 'down' ? (
      <ArrowUpRight className="h-2.5 w-2.5" />
    ) : (
      <Scale className="h-2.5 w-2.5" />
    )}
    {label}
  </span>
);

export const KpiCards: React.FC<KpiCardsProps> = React.memo(
  ({
    walletBalance,
    periodIncome,
    periodSpend,
    incomeCount,
    spendCount,
    dailyAvgSpend,
    safeDailyAllowance,
    onQuickAdd,
  }) => (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {/* Balance — primary card */}
      <article className="col-span-2 overflow-hidden rounded-2xl border border-indigo-900/20 bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_55%,#4338ca_100%)] p-4 text-white shadow-[0_18px_40px_-28px_rgba(49,46,129,0.9)] sm:p-5 xl:col-span-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
              Available Balance
            </p>
            <p
              className={`num mt-2 text-2xl font-bold leading-none tracking-tight sm:text-[28px] ${
                walletBalance < 0 ? 'text-rose-200' : 'text-white'
              }`}
            >
              {formatINR(walletBalance)}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Landmark className="h-4 w-4 text-indigo-100" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="text-[11px] font-medium text-indigo-200">All-time wallet</span>
          <TrendPill
            label={walletBalance >= 0 ? 'Healthy' : 'Overdrawn'}
            tone={walletBalance >= 0 ? 'up' : 'down'}
          />
        </div>
      </article>

      {/* Income */}
      <article className="rounded-2xl panel p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Money In
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDownLeft className="h-4 w-4" />
          </span>
        </div>
        <p className="num mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {formatINR(periodIncome)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {incomeCount} {incomeCount === 1 ? 'credit' : 'credits'}
          </span>
          <button
            type="button"
            onClick={() => onQuickAdd('income')}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            + Add
          </button>
        </div>
      </article>

      {/* Spend */}
      <article className="rounded-2xl panel p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Total Spends
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <p className="num mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {formatINR(periodSpend)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-500">{spendCount} debits</span>
          <button
            type="button"
            onClick={() => onQuickAdd('spend')}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            − Add
          </button>
        </div>
      </article>

      {/* Daily average / safe allowance */}
      <article className="col-span-2 rounded-2xl panel p-4 sm:p-5 xl:col-span-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Average / Day
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Scale className="h-4 w-4" />
          </span>
        </div>
        <p className="num mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {formatINR(dailyAvgSpend)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            Safe: {formatINR(safeDailyAllowance)}/day
          </span>
          <TrendPill
            label={safeDailyAllowance >= dailyAvgSpend ? 'On track' : 'Tight'}
            tone={safeDailyAllowance >= dailyAvgSpend ? 'up' : 'down'}
          />
        </div>
      </article>
    </section>
  )
);
KpiCards.displayName = 'KpiCards';

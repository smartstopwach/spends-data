import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calculator,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { formatINR, formatMonthLabel } from '../utils/mathAndFormat';

interface BalanceHeroProps {
  walletBalance: number;
  cashBalance: number;
  digitalBalance: number;
  periodIncome: number;
  homeOnlyIncome: number;
  periodSpend: number;
  incomeCount: number;
  spendCount: number;
  dailyAvgSpend: number;
  safeDailyAllowance: number;
  remainingDays: number;
  selectedMonth: string;
  onQuickSwitchMode: (mode: 'income' | 'spend') => void;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  walletBalance,
  cashBalance,
  digitalBalance,
  periodIncome,
  homeOnlyIncome,
  periodSpend,
  incomeCount,
  spendCount,
  dailyAvgSpend,
  safeDailyAllowance,
  remainingDays,
  selectedMonth,
  onQuickSwitchMode,
}) => {
  const periodLabel = selectedMonth === 'all' ? 'All Time' : formatMonthLabel(selectedMonth);
  const spendOfIncomePct =
    periodIncome > 0 ? Math.min(999, Math.round((periodSpend / periodIncome) * 100)) : 0;

  return (
    <section aria-label="Balance Summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Primary Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Abhi Bacha Paisa (Wallet)
            </p>
            <p
              className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                walletBalance < 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {formatINR(walletBalance)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            UPI/Bank: <strong className="font-semibold text-white">{formatINR(digitalBalance)}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            Cash: <strong className="font-semibold text-white">{formatINR(cashBalance)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Ghar Se Aaya (Inflow) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Ghar Se Aaya (+)
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600 tabular-nums">
              {formatINR(periodIncome, true)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickSwitchMode('income')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition cursor-pointer"
            title="Add Money from Home"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            + Add
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {periodLabel} • {incomeCount} {incomeCount === 1 ? 'entry' : 'entries'}
          </span>
          {homeOnlyIncome > 0 && homeOnlyIncome !== periodIncome && (
            <span className="font-medium text-emerald-700 tabular-nums">
              Ghar: {formatINR(homeOnlyIncome)}
            </span>
          )}
        </div>
      </div>

      {/* 3. Total Spends (Outflow) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Total Spends (-)
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-600 tabular-nums">
              {periodSpend > 0 ? `-${formatINR(periodSpend)}` : '₹0'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickSwitchMode('spend')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
            title="Add Spend / Kharcha"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            - Spend
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {spendCount} {spendCount === 1 ? 'kharcha' : 'kharche'}
          </span>
          {periodIncome > 0 ? (
            <span
              className={`font-semibold tabular-nums ${
                spendOfIncomePct > 90
                  ? 'text-rose-600'
                  : spendOfIncomePct > 70
                  ? 'text-amber-600'
                  : 'text-slate-700'
              }`}
            >
              {spendOfIncomePct}% of inflow
            </span>
          ) : (
            <span className="text-slate-400">{periodLabel}</span>
          )}
        </div>
      </div>

      {/* 4. Daily Average & Safe Spend */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Roz Ka Avg Spend
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {formatINR(dailyAvgSpend)}
              <span className="text-sm font-medium text-slate-400">/day</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {remainingDays > 0 ? (
            <>
              <span className="text-slate-500">{remainingDays} din baaki</span>
              <span className="font-semibold text-indigo-700 tabular-nums">
                Safe: {formatINR(safeDailyAllowance)}/day
              </span>
            </>
          ) : (
            <span className="text-slate-500">Mahine ka daily average hisaab</span>
          )}
        </div>
      </div>
    </section>
  );
};

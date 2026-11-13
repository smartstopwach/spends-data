import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DailySpendPoint } from '../hooks/useSpendsStore';
import { formatINR } from '../utils/mathAndFormat';

interface TrendCardProps {
  dailySeries: DailySpendPoint[];
  spend: number;
  budget: number;
  budgetUsedPercent: number;
  budgetRemaining: number;
  monthLabel: string;
  safeDailyAllowance: number;
}

export const TrendCard: React.FC<TrendCardProps> = React.memo(
  ({
    dailySeries,
    spend,
    budget,
    budgetUsedPercent,
    budgetRemaining,
    monthLabel,
    safeDailyAllowance,
  }) => {
    const { maxSpend, totalDays, activeDays } = useMemo(() => {
      let max = 0;
      let active = 0;
      for (const p of dailySeries) {
        if (p.spend > max) max = p.spend;
        if (p.spend > 0) active += 1;
      }
      return { maxSpend: max, totalDays: dailySeries.length, activeDays: active };
    }, [dailySeries]);

    const clampedPct = Math.min(100, Math.max(0, budgetUsedPercent));
    const overBudget = budget > 0 && spend > budget;

    return (
      <section aria-label="Spend trend and budget" className="panel flex flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Monthly Spend Trend</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {monthLabel} · {activeDays} active {activeDays === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/70">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
            <span className="num">Peak {formatINR(maxSpend)}</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="mt-5">
          <div className="flex h-[104px] items-end gap-[3px]">
            {dailySeries.map((p) => {
              const h = maxSpend > 0 ? Math.max(2, Math.round((p.spend / maxSpend) * 100)) : 2;
              return (
                <div key={p.day} className="group relative flex h-full flex-1 items-end">
                  <div
                    className={`w-full rounded-[3px] transition-colors ${
                      p.isToday
                        ? 'bg-indigo-600'
                        : p.spend > 0
                        ? 'bg-indigo-200 group-hover:bg-indigo-400'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  {p.spend > 0 && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-white group-hover:block">
                      {p.day}: {formatINR(p.spend)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
            <span>Day 1</span>
            <span className="num">{totalDays} days</span>
          </div>
        </div>

        {/* Budget strip */}
        <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>
              Budget usage{' '}
              <span className={`num ${overBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                {clampedPct}%
              </span>
            </span>
            <span className="num">
              {formatINR(spend)} / {formatINR(budget)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overBudget ? 'bg-rose-500' : clampedPct > 80 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {budgetRemaining >= 0 ? (
              <>
                <span className="num font-semibold text-slate-700">
                  {formatINR(budgetRemaining)}
                </span>{' '}
                left · safe to spend{' '}
                <span className="num font-semibold text-slate-700">
                  {formatINR(safeDailyAllowance)}
                </span>{' '}
                / day
              </>
            ) : (
              <span className="font-semibold text-rose-600">
                Over budget by {formatINR(Math.abs(budgetRemaining))}
              </span>
            )}
          </p>
        </div>
      </section>
    );
  }
);
TrendCard.displayName = 'TrendCard';

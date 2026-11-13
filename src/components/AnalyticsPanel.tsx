import React, { useState } from 'react';
import { Check, Edit3, PieChart, Target, TrendingUp } from 'lucide-react';
import { CategoryBreakdownItem, DailySpendPoint } from '../hooks/useSpendsStore';
import { SpendCategory } from '../types';
import { formatINR, formatMonthLabel } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsPanelProps {
  selectedMonth: string;
  activeMonthKey: string;
  periodIncome: number;
  periodSpend: number;
  periodNet: number;
  configuredBudget: number;
  effectiveLimit: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  safeDailyAllowance: number;
  remainingDays: number;
  dailyAvgSpend: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySeries: DailySpendPoint[];
  selectedCategoryFilter: SpendCategory | 'all';
  onSelectCategoryFilter: (cat: SpendCategory | 'all') => void;
  onUpdateBudget: (monthKey: string, amount: number) => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  selectedMonth,
  activeMonthKey,
  periodIncome,
  periodSpend,
  periodNet,
  configuredBudget,
  effectiveLimit,
  budgetRemaining,
  budgetUsedPercent,
  safeDailyAllowance,
  remainingDays,
  dailyAvgSpend,
  categoryBreakdown,
  dailySeries,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onUpdateBudget,
}) => {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(configuredBudget || ''));
  const [hoveredDay, setHoveredDay] = useState<DailySpendPoint | null>(null);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(budgetInput.replace(/[₹,\s]/g, ''));
    if (Number.isFinite(num) && num >= 0) {
      onUpdateBudget(activeMonthKey, num);
    }
    setEditingBudget(false);
  };

  // Donut chart geometry
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;

  // Daily chart max
  const maxDailySpend = Math.max(
    ...dailySeries.map((d) => d.spend),
    dailyAvgSpend * 1.2,
    100
  );

  const clampedBarPct = Math.min(100, Math.max(0, budgetUsedPercent));
  const barColor =
    budgetUsedPercent > 95
      ? 'bg-rose-500'
      : budgetUsedPercent >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="space-y-4">
      {/* 1. Monthly Budget & Net Hisaab Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Budget & Bachat ({formatMonthLabel(activeMonthKey)})
              </h3>
              <p className="text-xs text-slate-500">
                {configuredBudget > 0
                  ? `Set limit: ${formatINR(configuredBudget)}`
                  : 'Ghar ke aaye paise ke hisaab se'}
              </p>
            </div>
          </div>

          {!editingBudget ? (
            <button
              type="button"
              onClick={() => {
                setBudgetInput(String(configuredBudget || effectiveLimit || 8000));
                setEditingBudget(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Set Budget</span>
            </button>
          ) : (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-28 pl-6 pr-2 py-1.5 rounded-xl border border-emerald-400 text-xs font-bold tabular-nums focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                title="Save Budget"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 tabular-nums">
              Spent: <strong className="text-slate-900">{formatINR(periodSpend)}</strong>
              {effectiveLimit > 0 && (
                <span className="text-slate-400"> / {formatINR(effectiveLimit)}</span>
              )}
            </span>
            <span
              className={`font-bold tabular-nums ${
                budgetUsedPercent > 95
                  ? 'text-rose-600'
                  : budgetUsedPercent >= 75
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {effectiveLimit > 0 ? `${budgetUsedPercent}% used` : 'Set budget above'}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${clampedBarPct}%` }}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 tabular-nums">
              {selectedMonth === 'all' ? 'Kul Net Balance:' : 'Is Mahine Net (In - Spend):'}{' '}
              <strong className={periodNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatINR(periodNet, true)}
              </strong>
              {periodIncome > 0 && (
                <span className="text-slate-400"> (In: {formatINR(periodIncome)})</span>
              )}
            </span>

            {effectiveLimit > 0 && (
              <span className="font-medium text-slate-600 tabular-nums">
                {budgetRemaining >= 0 ? (
                  <>
                    Limit mein <strong className="text-emerald-700">{formatINR(budgetRemaining)}</strong> bacha
                    {remainingDays > 0 && ` • ${formatINR(safeDailyAllowance)}/day`}
                  </>
                ) : (
                  <span className="text-rose-600 font-semibold">
                    Budget se {formatINR(Math.abs(budgetRemaining))} zyada kharch!
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Breakdown & Daily Bar Chart Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Category Donut + Bars */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900">Category-wise Kharcha</h3>
            </div>
            {selectedCategoryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCategoryFilter('all')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 py-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                <PieChart className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">Is period mein koi spend nahi hai</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Jab aap kharcha add karenge, category chart yahan dikhega
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* SVG Donut */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="18"
                  />
                  {categoryBreakdown.map((item) => {
                    const fraction = periodSpend > 0 ? item.amount / periodSpend : 0;
                    const dashLength = fraction * circumference;
                    const dashOffset = -cumulativeFraction * circumference;
                    cumulativeFraction += fraction;

                    return (
                      <circle
                        key={item.category}
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={selectedCategoryFilter === item.category ? '21' : '18'}
                        strokeDasharray={`${dashLength} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-300 cursor-pointer"
                        onClick={() =>
                          onSelectCategoryFilter(
                            selectedCategoryFilter === item.category ? 'all' : item.category
                          )
                        }
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    Spends
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatINR(periodSpend)}
                  </span>
                </div>
              </div>

              {/* Category Rows */}
              <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {categoryBreakdown.map((item) => {
                  const isSelected = selectedCategoryFilter === item.category;
                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() =>
                        onSelectCategoryFilter(isSelected ? 'all' : item.category)
                      }
                      className={`w-full text-left p-2 rounded-xl transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 ring-1 ring-slate-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                          <span className={`p-1 rounded-md ${item.bgClass} ${item.textClass}`}>
                            <CategoryIcon name={item.iconName} className="w-3 h-3" />
                          </span>
                          <span>{item.label}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            ({item.count})
                          </span>
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatINR(item.amount)}{' '}
                          <span className="text-[11px] font-medium text-slate-400">
                            ({item.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(3, item.percentage)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spend Trend Bar Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Roz Ka Kharcha ({formatMonthLabel(activeMonthKey).split(' ')[0]})
                </h3>
              </div>
            </div>

            <div className="text-right text-xs tabular-nums">
              {hoveredDay ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold">
                  <span>Day {hoveredDay.day}:</span>
                  <span className="text-rose-300">-{formatINR(hoveredDay.spend)}</span>
                  {hoveredDay.income > 0 && (
                    <span className="text-emerald-300">+{formatINR(hoveredDay.income)}</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 font-medium">
                  Avg: {formatINR(dailyAvgSpend)}/day
                </span>
              )}
            </div>
          </div>

          {/* Bars Container */}
          <div className="relative h-40 pt-4 pb-1 flex items-end gap-1 select-none">
            {/* Average Reference Line */}
            {dailyAvgSpend > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-indigo-300 pointer-events-none z-10"
                style={{
                  bottom: `${Math.min(92, Math.max(6, (dailyAvgSpend / maxDailySpend) * 100))}%`,
                }}
              />
            )}

            {dailySeries.map((pt) => {
              const heightPct =
                pt.spend > 0 ? Math.max(8, Math.round((pt.spend / maxDailySpend) * 100)) : 3;

              return (
                <div
                  key={pt.day}
                  onMouseEnter={() => setHoveredDay(pt)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => setHoveredDay(pt)}
                  className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                >
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[14px] rounded-t-md transition-all ${
                        pt.spend > 0
                          ? pt.isToday
                            ? 'bg-indigo-600 group-hover:bg-indigo-700'
                            : 'bg-rose-400/85 group-hover:bg-rose-600'
                          : pt.isToday
                          ? 'bg-indigo-200'
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-1.5 text-[9px] tabular-nums leading-none ${
                      pt.isToday
                        ? 'font-extrabold text-indigo-600'
                        : pt.day === 1 || pt.day % 5 === 0
                        ? 'text-slate-400 font-medium'
                        : 'text-transparent group-hover:text-slate-500'
                    }`}
                  >
                    {pt.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" /> Daily Spend
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block ml-2" /> Today
            </span>
            <span>Hover/tap bar for exact date hisaab</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useId, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { DailySpendPoint } from '../hooks/useSpendsStore';
import { formatINR } from '../utils/mathAndFormat';

type SeriesKey = 'spend' | 'income';

interface TrendCardProps {
  dailySeries: DailySpendPoint[];
  spend: number;
  budget: number;
  budgetUsedPercent: number;
  budgetRemaining: number;
  monthLabel: string;
  safeDailyAllowance: number;
}

const VIEW_W = 640;
const VIEW_H = 196;
const PAD = { top: 18, right: 6, bottom: 22, left: 6 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

const compactINR = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₹${Math.round(value)}`;
};

/** Catmull-Rom → cubic bézier for a smooth, pleasing curve. */
function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;

  let d = `M ${points[0][0]},${points[0][1]}`;
  const tension = 0.17;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(
      2
    )},${p2[1].toFixed(2)}`;
  }
  return d;
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
    const [series, setSeries] = useState<SeriesKey>('spend');
    const [hover, setHover] = useState<number | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const uid = useId().replace(/:/g, '');

    const { points, maxValue, maxPeak, totals, activeDays, labels, hasData } = useMemo(() => {
      const n = dailySeries.length;
      let max = 0;
      let spendTotal = 0;
      let incomeTotal = 0;
      let active = 0;

      for (const point of dailySeries) {
        const value = series === 'spend' ? point.spend : point.income;
        if (value > max) max = value;
        if (point.spend > 0 || point.income > 0) active += 1;
        spendTotal += point.spend;
        incomeTotal += point.income;
      }

      const niceMax = max <= 0 ? 100 : Math.ceil((max * 1.18) / 50) * 50;
      const step = n > 1 ? PLOT_W / (n - 1) : 0;

      const coords: Array<[number, number]> = dailySeries.map((point, i) => {
        const value = series === 'spend' ? point.spend : point.income;
        const x = PAD.left + i * step;
        const y = PAD.top + PLOT_H - (value / niceMax) * PLOT_H;
        return [x, y];
      });

      const firstLabel = 1;
      const midLabel = Math.max(2, Math.round(n / 2));
      const lastLabel = n;
      const idxs = Array.from(new Set([firstLabel, midLabel, lastLabel]));

      return {
        points: coords,
        maxPeak: max,
        maxValue: niceMax,
        totals: { spend: spendTotal, income: incomeTotal },
        activeDays: active,
        labels: idxs.map((day) => ({ day, x: PAD.left + (day - 1) * step })),
        hasData: max > 0,
      };
    }, [dailySeries, series]);

    const linePath = useMemo(() => smoothPath(points), [points]);
    const areaPath = useMemo(() => {
      if (points.length === 0) return '';
      const baseY = PAD.top + PLOT_H;
      return `${linePath} L ${points[points.length - 1][0]},${baseY} L ${points[0][0]},${baseY} Z`;
    }, [linePath, points]);

    const budgetY = useMemo(() => {
      if (!budget || budget <= 0) return null;
      const dailyLine = budget / Math.max(1, dailySeries.length);
      if (dailyLine > maxValue) return null;
      return PAD.top + PLOT_H - (dailyLine / maxValue) * PLOT_H;
    }, [budget, dailySeries.length, maxValue]);

    const hovered = hover !== null ? dailySeries[hover] ?? null : null;
    const hoverValue = hovered ? (series === 'spend' ? hovered.spend : hovered.income) : 0;

    const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
      const el = wrapRef.current;
      if (!el || dailySeries.length === 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const scaled = ((ratio * VIEW_W - PAD.left) / PLOT_W) * (dailySeries.length - 1);
      const index = Math.round(Math.min(Math.max(scaled, 0), dailySeries.length - 1));
      setHover(index);
    };

    const isLight = series === 'spend';
    const stroke = isLight ? '#4f46e5' : '#059669';
    const gradTop = isLight ? '#4f46e5' : '#10b981';

    const clampedPct = Math.min(100, Math.max(0, budgetUsedPercent));
    const overBudget = budget > 0 && spend > budget;

    return (
      <section aria-label="Spend trend and budget" className="panel flex flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Monthly Trend</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {monthLabel} · {activeDays} active {activeDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setSeries('spend')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                series === 'spend'
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              Spends
            </button>
            <button
              type="button"
              onClick={() => setSeries('income')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                series === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="h-3 w-3" />
              Money in
            </button>
          </div>
        </div>

        {/* Legend / totals */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-4 rounded-full"
              style={{ backgroundColor: stroke }}
              aria-hidden
            />
            <span className="num font-semibold text-slate-800">
              {formatINR(series === 'spend' ? totals.spend : totals.income)}
            </span>
            <span>{series === 'spend' ? 'total out' : 'total in'}</span>
          </span>
          {hasData && (
            <span className="num flex items-center gap-1 text-slate-400">
              <TrendingUp className="h-3 w-3" />
              peak {compactINR(maxPeak)}
            </span>
          )}
          {hovered && (
            <span className="num ml-auto rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
              {hovered.day} {monthLabel.split(' ')[0].slice(0, 3)} ·{' '}
              {series === 'spend' ? '−' : '+'}
              {formatINR(hoverValue)}
            </span>
          )}
        </div>

        {/* Chart */}
        <div
          ref={wrapRef}
          className="relative mt-3 select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-[168px] w-full sm:h-[188px]"
            role="img"
            aria-label={`Daily ${series === 'spend' ? 'spending' : 'incoming money'} for ${monthLabel}`}
          >
            <defs>
              <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradTop} stopOpacity="0.28" />
                <stop offset="60%" stopColor={gradTop} stopOpacity="0.08" />
                <stop offset="100%" stopColor={gradTop} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
                <stop offset="45%" stopColor={stroke} stopOpacity="1" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.7" />
              </linearGradient>
              <clipPath id={`clip-${uid}`}>
                <rect x={PAD.left} y={PAD.top - 6} width={PLOT_W} height={PLOT_H + 12} />
              </clipPath>
            </defs>

            {/* gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = PAD.top + PLOT_H - ratio * PLOT_H;
              return (
                <g key={ratio}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + PLOT_W}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray={ratio === 0 ? undefined : '3 5'}
                    opacity={ratio === 0 ? 1 : 0.75}
                  />
                  {ratio > 0 && (
                    <text
                      x={PAD.left + PLOT_W}
                      y={y - 4}
                      textAnchor="end"
                      className="fill-slate-300 text-[9px] font-semibold"
                    >
                      {compactINR(maxValue * ratio)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* monthly budget pace line */}
            {budgetY !== null && (
              <line
                x1={PAD.left}
                x2={PAD.left + PLOT_W}
                y1={budgetY}
                y2={budgetY}
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="5 4"
                opacity={0.7}
              />
            )}

            {hasData ? (
              <g clipPath={`url(#clip-${uid})`}>
                <path d={areaPath} fill={`url(#fill-${uid})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={`url(#stroke-${uid})`}
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* today marker */}
                {dailySeries.map((point, i) =>
                  point.isToday ? (
                    <g key={`today-${point.day}`}>
                      <circle cx={points[i][0]} cy={points[i][1]} r={7} fill={stroke} opacity={0.15} />
                      <circle
                        cx={points[i][0]}
                        cy={points[i][1]}
                        r={3.5}
                        fill="#fff"
                        stroke={stroke}
                        strokeWidth={2}
                      />
                    </g>
                  ) : null
                )}
              </g>
            ) : (
              <text
                x={VIEW_W / 2}
                y={PAD.top + PLOT_H / 2}
                textAnchor="middle"
                className="fill-slate-300 text-[11px] font-semibold"
              >
                No {series === 'spend' ? 'spends' : 'money in'} recorded yet
              </text>
            )}

            {/* hover guide */}
            {hover !== null && points[hover] && (
              <g pointerEvents="none">
                <line
                  x1={points[hover][0]}
                  x2={points[hover][0]}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={points[hover][0]}
                  cy={points[hover][1]}
                  r={4.5}
                  fill="#fff"
                  stroke={stroke}
                  strokeWidth={2.5}
                />
              </g>
            )}

            {/* x labels */}
            {labels.map((label) => (
              <text
                key={label.day}
                x={label.x}
                y={VIEW_H - 4}
                textAnchor={label.day === 1 ? 'start' : label.day === dailySeries.length ? 'end' : 'middle'}
                className="fill-slate-400 text-[9px] font-semibold"
              >
                {label.day}
              </text>
            ))}
          </svg>
        </div>

        {/* Budget strip */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
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
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
            {budgetRemaining >= 0 ? (
              <span>
                <span className="num font-semibold text-slate-700">
                  {formatINR(budgetRemaining)}
                </span>{' '}
                left · safe{' '}
                <span className="num font-semibold text-slate-700">
                  {formatINR(safeDailyAllowance)}
                </span>
                /day
              </span>
            ) : (
              <span className="font-semibold text-rose-600">
                Over budget by {formatINR(Math.abs(budgetRemaining))}
              </span>
            )}
            {budgetY !== null && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="h-0 w-4 border-t border-dashed border-amber-500" />
                budget pace
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }
);
TrendCard.displayName = 'TrendCard';

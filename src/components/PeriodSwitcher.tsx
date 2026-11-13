import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Infinity as InfinityIcon } from 'lucide-react';
import { useTodayISO } from '../hooks/useTodayISO';
import { PeriodInfo, PeriodMode, PeriodState, currentPeriod, shiftPeriod } from '../utils/period';

interface PeriodSwitcherProps {
  period: PeriodInfo;
  state: PeriodState;
  onChange: (next: PeriodState) => void;
  compact?: boolean;
}

const MODES: Array<{
  id: PeriodMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'week', label: 'Week', icon: CalendarDays },
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'all', label: 'All', icon: InfinityIcon },
];

export const PeriodSwitcher: React.FC<PeriodSwitcherProps> = React.memo(
  ({ period, state, onChange, compact = false }) => {
    const today = useTodayISO();
    const isAll = period.mode === 'all';
    const atCurrent = period.toISO >= today;

    return (
      <div className="flex items-center gap-1.5">
        {/* Mode segmented control */}
        <div
          role="tablist"
          aria-label="Period"
          className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
        >
          {MODES.map((m) => {
            const active = period.mode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onChange(currentPeriod(m.id))}
                className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {!compact && <Icon className="h-3 w-3" />}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Range stepper */}
        {!isAll && (
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onChange(shiftPeriod(state, -1))}
              aria-label={`Previous ${period.mode}`}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span
              className="num whitespace-nowrap px-1 text-[11px] font-bold text-slate-800"
              title={period.label}
            >
              {period.mode === 'week' ? period.label : period.label.replace(/ \d{4}$/, '')}
            </span>
            <button
              type="button"
              onClick={() => onChange(shiftPeriod(state, 1))}
              disabled={!period.canGoNext}
              aria-label={`Next ${period.mode}`}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {atCurrent && !isAll && (
          <span className="hidden rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 lg:inline">
            {period.mode === 'week' ? 'This week' : 'This month'}
          </span>
        )}
      </div>
    );
  }
);
PeriodSwitcher.displayName = 'PeriodSwitcher';

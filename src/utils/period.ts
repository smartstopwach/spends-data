import { getCurrentMonthKey, getTodayISO, shiftISODate, shiftMonthKey } from './mathAndFormat';

export type PeriodMode = 'week' | 'month' | 'all';

export interface PeriodState {
  mode: PeriodMode;
  /** Anchor date (ISO) for the week, or `YYYY-MM` for the month. */
  anchor: string;
}

export interface PeriodInfo {
  mode: PeriodMode;
  fromISO: string;
  toISO: string;
  label: string;
  shortLabel: string;
  sublabel: string;
  /** Value matching the stored `paymentMode` style key used by filters. */
  key: string;
  canGoNext: boolean;
}

const startOfWeek = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // ISO week starts Monday
  return shiftISODate(iso, diff);
};

const shortDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const currentPeriod = (mode: PeriodMode = 'month'): PeriodState => ({
  mode,
  anchor: mode === 'week' ? getTodayISO() : getCurrentMonthKey(),
});

/** Resolves the active period into concrete from → to dates plus display labels. */
export function resolvePeriod(state: PeriodState): PeriodInfo {
  const today = getTodayISO();

  if (state.mode === 'week') {
    const anchor = state.anchor.includes('-') && state.anchor.length === 10 ? state.anchor : today;
    const fromISO = startOfWeek(anchor);
    const toISO = shiftISODate(fromISO, 6);
    return {
      mode: 'week',
      fromISO,
      toISO,
      label: `${shortDate(fromISO)} – ${shortDate(toISO)}`,
      shortLabel: 'This week',
      sublabel: 'Week (Mon–Sun)',
      key: `week-${fromISO}`,
      canGoNext: toISO < today,
    };
  }

  if (state.mode === 'month') {
    const monthKey = /^\d{4}-\d{2}$/.test(state.anchor) ? state.anchor : getCurrentMonthKey();
    const [y, m] = monthKey.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      mode: 'month',
      fromISO: `${monthKey}-01`,
      toISO: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
      label: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      shortLabel: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' }),
      sublabel: 'Month',
      key: `month-${monthKey}`,
      canGoNext: monthKey < getCurrentMonthKey(),
    };
  }

  return {
    mode: 'all',
    fromISO: '0000-01-01',
    toISO: '9999-12-31',
    label: 'All time',
    shortLabel: 'All time',
    sublabel: 'Everything',
    key: 'all',
    canGoNext: false,
  };
}

export function shiftPeriod(state: PeriodState, delta: number): PeriodState {
  if (state.mode === 'week') {
    const anchor = state.anchor.length === 10 ? state.anchor : getTodayISO();
    return { mode: 'week', anchor: shiftISODate(startOfWeek(anchor), delta * 7) };
  }
  if (state.mode === 'month') {
    const monthKey = /^\d{4}-\d{2}$/.test(state.anchor) ? state.anchor : getCurrentMonthKey();
    return { mode: 'month', anchor: shiftMonthKey(monthKey, delta) };
  }
  return state;
}

export const isWithinPeriod = (dateISO: string, period: PeriodInfo): boolean =>
  dateISO >= period.fromISO && dateISO <= period.toISO;

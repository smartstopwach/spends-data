import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALL_CATEGORY_MAP, createSampleTransactions, SPEND_CATEGORIES } from '../constants';
import { IncomeSource, MonthlyBudgets, PaymentMode, SpendCategory, Transaction, TransactionType } from '../types';
import { getCurrentMonthKey, getDaysInMonth, getTodayISO, shiftISODate } from '../utils/mathAndFormat';
import { PeriodMode, PeriodState, currentPeriod, resolvePeriod } from '../utils/period';

const TX_STORAGE_KEY = 'ghar_ka_hisaab_tx_v1';
const BUDGET_STORAGE_KEY = 'ghar_ka_hisaab_budgets_v1';
const INIT_STORAGE_KEY = 'ghar_ka_hisaab_init_v1';

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  category: SpendCategory | IncomeSource;
  paymentMode: PaymentMode;
  date: string;
  note: string;
}

export interface CategoryBreakdownItem {
  category: SpendCategory;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  iconName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailySpendPoint {
  day: number;
  date: string;
  spend: number;
  income: number;
  isToday: boolean;
  isFuture: boolean;
}

export function useSpendsStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const initialized = window.localStorage.getItem(INIT_STORAGE_KEY);
      const saved = window.localStorage.getItem(TX_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) =>
              item &&
              typeof item.id === 'string' &&
              typeof item.date === 'string' &&
              typeof item.amount === 'number' &&
              (item.type === 'income' || item.type === 'spend')
          );
        }
      }
      if (!initialized) {
        const demo = createSampleTransactions(new Date());
        window.localStorage.setItem(INIT_STORAGE_KEY, '1');
        window.localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(demo));
        return demo;
      }
      return [];
    } catch {
      return createSampleTransactions(new Date());
    }
  });

  const [budgets, setBudgets] = useState<MonthlyBudgets>(() => {
    try {
      const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return { default: 8500 };
  });

  const [period, setPeriodState] = useState<PeriodState>(() => currentPeriod('month'));
  const periodInfo = useMemo(() => resolvePeriod(period), [period]);

  const setPeriod = useCallback((next: PeriodState) => setPeriodState(next), []);
  const setPeriodMode = useCallback(
    (mode: PeriodMode) => setPeriodState(currentPeriod(mode)),
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
      localStorage.setItem(INIT_STORAGE_KEY, '1');
    } catch {
      // ignore quota errors
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch {
      // ignore
    }
  }, [budgets]);

  const addTransaction = useCallback((input: NewTransactionInput) => {
    const tx: Transaction = {
      ...input,
      amount: Math.round(input.amount * 100) / 100,
      note: input.note.trim(),
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, []);

  const addMultipleTransactions = useCallback((inputs: NewTransactionInput[]) => {
    const now = Date.now();
    const created: Transaction[] = inputs.map((input, idx) => ({
      ...input,
      amount: Math.round(input.amount * 100) / 100,
      note: input.note.trim(),
      id: `tx-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now + idx,
    }));
    setTransactions((prev) => [...created.reverse(), ...prev]);
    return created;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<NewTransactionInput>) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              ...updates,
              amount: updates.amount !== undefined ? Math.round(updates.amount * 100) / 100 : tx.amount,
              note: updates.note !== undefined ? updates.note.trim() : tx.note,
            }
          : tx
      )
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const clearDemoTransactions = useCallback(() => {
    setTransactions((prev) => prev.filter((tx) => !tx.id.startsWith('demo-')));
  }, []);

  const loadDemoData = useCallback(() => {
    const demo = createSampleTransactions(new Date());
    setTransactions((prev) => {
      const withoutOldDemo = prev.filter((tx) => !tx.id.startsWith('demo-'));
      return [...demo, ...withoutOldDemo];
    });
    setPeriodState(currentPeriod('month'));
  }, []);

  const clearAllData = useCallback(() => {
    setTransactions([]);
  }, []);

  const setBudgetForMonth = useCallback((monthKey: string, amount: number) => {
    const clean = Math.max(0, Math.round(amount));
    setBudgets((prev) => ({
      ...prev,
      [monthKey]: clean,
      default: clean || prev.default,
    }));
  }, []);

  const importBackupData = useCallback((rawJson: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(rawJson);
      const list = Array.isArray(parsed) ? parsed : parsed?.transactions;
      if (!Array.isArray(list)) {
        return { ok: false, message: 'Invalid backup file format.' };
      }
      const validTx: Transaction[] = list
        .filter(
          (item) =>
            item &&
            (item.type === 'income' || item.type === 'spend') &&
            typeof item.amount === 'number' &&
            item.amount > 0 &&
            typeof item.date === 'string'
        )
        .map((item, idx) => ({
          id: typeof item.id === 'string' ? item.id : `imp-${Date.now()}-${idx}`,
          type: item.type,
          amount: Math.round(item.amount * 100) / 100,
          category: ALL_CATEGORY_MAP[item.category] ? item.category : item.type === 'income' ? 'home' : 'other',
          paymentMode: ['upi', 'cash', 'bank'].includes(item.paymentMode) ? item.paymentMode : 'upi',
          date: item.date,
          note: typeof item.note === 'string' ? item.note : '',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now() - idx,
        }));

      setTransactions(validTx);
      if (parsed?.budgets && typeof parsed.budgets === 'object') {
        setBudgets(parsed.budgets);
      }
      return { ok: true, message: `${validTx.length} entries restored successfully!` };
    } catch {
      return { ok: false, message: 'Could not read that JSON file. Choose a valid backup.' };
    }
  }, []);

  const hasDemoEntries = useMemo(() => transactions.some((t) => t.id.startsWith('demo-')), [transactions]);

  // All-time wallet totals
  const walletSummary = useMemo(() => {
    let totalIncome = 0;
    let totalSpend = 0;
    let cashBalance = 0;
    let digitalBalance = 0;
    let homeMoneyTotal = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (tx.category === 'home' || tx.category === 'family_gift') {
          homeMoneyTotal += tx.amount;
        }
        if (tx.paymentMode === 'cash') cashBalance += tx.amount;
        else digitalBalance += tx.amount;
      } else {
        totalSpend += tx.amount;
        if (tx.paymentMode === 'cash') cashBalance -= tx.amount;
        else digitalBalance -= tx.amount;
      }
    }

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalSpend: Math.round(totalSpend * 100) / 100,
      balance: Math.round((totalIncome - totalSpend) * 100) / 100,
      cashBalance: Math.round(cashBalance * 100) / 100,
      digitalBalance: Math.round(digitalBalance * 100) / 100,
      homeMoneyTotal: Math.round(homeMoneyTotal * 100) / 100,
    };
  }, [transactions]);

  // Transactions inside the active period (week / month / all time)
  const periodTransactions = useMemo(() => {
    if (periodInfo.mode === 'all') return transactions;
    return transactions.filter(
      (tx) => tx.date >= periodInfo.fromISO && tx.date <= periodInfo.toISO
    );
  }, [transactions, periodInfo]);

  // Period Analytics
  const periodAnalytics = useMemo(() => {
    let income = 0;
    let homeOnlyIncome = 0;
    let spend = 0;
    let incomeCount = 0;
    let spendCount = 0;

    const categoryTotals: Record<string, { amount: number; count: number }> = {};

    for (const tx of periodTransactions) {
      if (tx.type === 'income') {
        income += tx.amount;
        incomeCount++;
        if (tx.category === 'home' || tx.category === 'family_gift') {
          homeOnlyIncome += tx.amount;
        }
      } else {
        spend += tx.amount;
        spendCount++;
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = { amount: 0, count: 0 };
        }
        categoryTotals[tx.category].amount += tx.amount;
        categoryTotals[tx.category].count += 1;
      }
    }

    const categoryBreakdown: CategoryBreakdownItem[] = SPEND_CATEGORIES.map((meta) => {
      const stat = categoryTotals[meta.id] || { amount: 0, count: 0 };
      const amt = Math.round(stat.amount * 100) / 100;
      return {
        category: meta.id as SpendCategory,
        label: meta.label,
        color: meta.color,
        bgClass: meta.bgClass,
        textClass: meta.textClass,
        iconName: meta.iconName,
        amount: amt,
        percentage: spend > 0 ? Math.round((amt / spend) * 1000) / 10 : 0,
        count: stat.count,
      };
    })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const todayStr = getTodayISO();
    const todayDay = Number(todayStr.split('-')[2]);
    const currentMonthKey = getCurrentMonthKey();
    const activeMonthKey = periodInfo.mode === 'month' ? period.anchor : currentMonthKey;
    const daysInMonth = getDaysInMonth(activeMonthKey);

    let elapsedDays = daysInMonth;
    let remainingDays = 0;

    if (periodInfo.mode === 'all') {
      const uniqueDates = new Set(periodTransactions.map((t) => t.date));
      elapsedDays = Math.max(1, uniqueDates.size);
      remainingDays = Math.max(0, daysInMonth - todayDay + 1);
    } else if (periodInfo.toISO >= todayStr && periodInfo.fromISO <= todayStr) {
      // Active period containing today → count only elapsed days
      const [fy, fm, fd] = periodInfo.fromISO.split('-').map(Number);
      const [ty, tm, td] = todayStr.split('-').map(Number);
      elapsedDays = Math.max(
        1,
        Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000) + 1
      );
      remainingDays = Math.max(
        1,
        Math.round(
          (Date.UTC(
            ...(periodInfo.toISO.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))) as [
              number,
              number,
              number
            ])
          ) -
            Date.UTC(ty, tm - 1, td)) /
            86_400_000
        ) + 1
      );
    } else if (periodInfo.fromISO > todayStr) {
      elapsedDays = 1;
      remainingDays = daysInMonth;
    } else {
      // Fully elapsed period
      elapsedDays = Math.max(1, periodTransactions.length ? new Set(periodTransactions.map((t) => t.date)).size : 1);
      remainingDays = 0;
    }

    const dailyAvgSpend = spend > 0 ? Math.round(spend / elapsedDays) : 0;

    const configuredBudget =
      periodInfo.mode === 'month'
        ? budgets[period.anchor] ?? budgets.default ?? 0
        : budgets[activeMonthKey] ?? budgets.default ?? 0;

    // Effective reference limit: user's monthly budget if > 0, else monthly income
    const effectiveLimit = configuredBudget > 0 ? configuredBudget : income;
    const budgetRemaining = Math.round((effectiveLimit - spend) * 100) / 100;
    const safeDailyAllowance =
      remainingDays > 0 && budgetRemaining > 0 ? Math.round(budgetRemaining / remainingDays) : 0;
    const budgetUsedPercent = effectiveLimit > 0 ? Math.min(999, Math.round((spend / effectiveLimit) * 100)) : 0;

    // Daily series for the active period (week → 7 days, month → days of month)
    const dailyMap: Record<number, { spend: number; income: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { spend: 0, income: 0 };
    }

    const chartTx = periodTransactions;

    for (const tx of chartTx) {
      const dayNum = Number(tx.date.split('-')[2]);
      if (dailyMap[dayNum]) {
        if (tx.type === 'spend') dailyMap[dayNum].spend += tx.amount;
        else dailyMap[dayNum].income += tx.amount;
      }
    }

    const dailySeries: DailySpendPoint[] = [];

    if (periodInfo.mode === 'week') {
      for (let i = 0; i < 7; i += 1) {
        const dateIso = shiftISODate(periodInfo.fromISO, i);
        const dayNum = Number(dateIso.split('-')[2]);
        const isSameMonth = dateIso.slice(0, 7) === activeMonthKey;
        const bucket = isSameMonth ? dailyMap[dayNum] : undefined;
        dailySeries.push({
          day: i + 1,
          date: dateIso,
          spend: Math.round((bucket?.spend ?? 0) * 100) / 100,
          income: Math.round((bucket?.income ?? 0) * 100) / 100,
          isToday: dateIso === todayStr,
          isFuture: dateIso > todayStr,
        });
      }
    } else {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateIso = `${activeMonthKey}-${String(d).padStart(2, '0')}`;
        dailySeries.push({
          day: d,
          date: dateIso,
          spend: Math.round(dailyMap[d].spend * 100) / 100,
          income: Math.round(dailyMap[d].income * 100) / 100,
          isToday: dateIso === todayStr,
          isFuture: dateIso > todayStr,
        });
      }
    }

    return {
      periodInfo,
      income: Math.round(income * 100) / 100,
      homeOnlyIncome: Math.round(homeOnlyIncome * 100) / 100,
      spend: Math.round(spend * 100) / 100,
      net: Math.round((income - spend) * 100) / 100,
      incomeCount,
      spendCount,
      categoryBreakdown,
      dailyAvgSpend,
      configuredBudget,
      effectiveLimit,
      budgetRemaining,
      safeDailyAllowance,
      budgetUsedPercent,
      remainingDays,
      elapsedDays,
      dailySeries,
      activeMonthKey,
    };
  }, [periodTransactions, period, periodInfo, budgets, transactions]);

  return {
    transactions,
    periodTransactions,
    period,
    periodInfo,
    setPeriod,
    setPeriodMode,
    budgets,
    setBudgetForMonth,
    walletSummary,
    periodAnalytics,
    hasDemoEntries,
    addTransaction,
    addMultipleTransactions,
    updateTransaction,
    deleteTransaction,
    clearDemoTransactions,
    loadDemoData,
    clearAllData,
    importBackupData,
  };
}

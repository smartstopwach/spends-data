import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CategoryPanel } from './components/CategoryPanel';
import { EntryPanel } from './components/EntryPanel';
import { KpiCards } from './components/KpiCards';
import { LedgerTabsCard } from './components/LedgerTabsCard';
import { TrendCard } from './components/TrendCard';
import { useSpendsStore } from './hooks/useSpendsStore';
import { SpendCategory, TransactionType } from './types';
import {
  exportBackupJSON,
  exportTransactionsToCSV,
  formatMonthLabel,
  getCurrentMonthKey,
  shiftMonthKey,
} from './utils/mathAndFormat';

export const App: React.FC = () => {
  const {
    transactions,
    periodTransactions,
    selectedMonth,
    setSelectedMonth,
    budgets,
    walletSummary,
    periodAnalytics,
    hasDemoEntries,
    addTransaction,
    deleteTransaction,
    clearDemoTransactions,
    loadDemoData,
    clearAllData,
  } = useSpendsStore();

  const [activeType, setActiveType] = useState<TransactionType>('spend');
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<SpendCategory | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const currentMonthKey = getCurrentMonthKey();

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  const handleQuickAdd = useCallback((mode: TransactionType) => {
    setActiveType(mode);
    setFocusTrigger((n) => n + 1);
    document.getElementById('entry-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const monthLabel = formatMonthLabel(selectedMonth);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-900">
      {/* ── App bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white shadow-sm">
              ₹
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900">
                GharKaHisaab
              </p>
              <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400 sm:block">
                Expense Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Month selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(
                    selectedMonth === 'all' ? currentMonthKey : shiftMonthKey(selectedMonth, -1)
                  );
                  setSelectedCategory('all');
                }}
                aria-label="Previous month"
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(selectedMonth === 'all' ? currentMonthKey : 'all');
                  setSelectedCategory('all');
                }}
                title="Toggle All Time"
                className="num whitespace-nowrap px-1.5 text-[11px] font-bold text-slate-800 transition hover:text-indigo-600"
              >
                {selectedMonth === 'all' ? 'All time' : monthLabel.replace(/ \d{4}$/, ' ’' + selectedMonth.slice(2, 4))}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(
                    selectedMonth === 'all' ? currentMonthKey : shiftMonthKey(selectedMonth, 1)
                  );
                  setSelectedCategory('all');
                }}
                aria-label="Next month"
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Actions
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10"
                  >
                    <button
                      role="menuitem"
                      type="button"
                      disabled={transactions.length === 0}
                      onClick={() => {
                        exportTransactionsToCSV(transactions);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-500" />
                      Export CSV
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        exportBackupJSON(transactions, budgets);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <FileJson className="h-3.5 w-3.5 text-emerald-500" />
                      Download backup
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        loadDemoData();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Load sample data
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      role="menuitem"
                      type="button"
                      disabled={transactions.length === 0}
                      onClick={() => {
                        clearAllData();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset all data
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6">
        {/* Page header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
              Overview
            </h1>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              {monthLabel} ·{' '}
              <span className="num">
                {periodTransactions.length}{' '}
                {periodTransactions.length === 1 ? 'entry' : 'entries'}
              </span>{' '}
              · data stays in this browser
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd('income')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              + Ghar se paisa
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd('spend')}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add spend
            </button>
          </div>
        </div>

        {hasDemoEntries && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5">
            <p className="text-[11px] font-semibold text-indigo-900">
              You are viewing sample data. Add your own entry any time.
            </p>
            <button
              type="button"
              onClick={clearDemoTransactions}
              className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
            >
              Clear sample
            </button>
          </div>
        )}

        <KpiCards
          walletBalance={walletSummary.balance}
          periodIncome={periodAnalytics.income}
          periodSpend={periodAnalytics.spend}
          incomeCount={periodAnalytics.incomeCount}
          spendCount={periodAnalytics.spendCount}
          dailyAvgSpend={periodAnalytics.dailyAvgSpend}
          safeDailyAllowance={periodAnalytics.safeDailyAllowance}
          onQuickAdd={handleQuickAdd}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <TrendCard
              dailySeries={periodAnalytics.dailySeries}
              spend={periodAnalytics.spend}
              budget={periodAnalytics.effectiveLimit}
              budgetUsedPercent={periodAnalytics.budgetUsedPercent}
              budgetRemaining={periodAnalytics.budgetRemaining}
              monthLabel={monthLabel}
              safeDailyAllowance={periodAnalytics.safeDailyAllowance}
            />

            <LedgerTabsCard
              transactions={periodTransactions}
              selectedCategory={selectedCategory}
              onClearCategory={() => setSelectedCategory('all')}
              onDelete={deleteTransaction}
              onLoadDemo={loadDemoData}
              totalOverallCount={transactions.length}
              monthLabel={monthLabel}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <div id="entry-panel" className="scroll-mt-20">
              <EntryPanel
                activeType={activeType}
                onChangeType={setActiveType}
                onAdd={addTransaction}
                focusTrigger={focusTrigger}
              />
            </div>

            <CategoryPanel
              items={periodAnalytics.categoryBreakdown}
              totalSpend={periodAnalytics.spend}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-4 text-[11px] font-medium text-slate-400">
          <span>GharKaHisaab · offline-first expense console</span>
          <span className="num">
            Balance {walletSummary.balance >= 0 ? 'positive' : 'negative'} · {transactions.length}{' '}
            total records
          </span>
        </footer>
      </main>
    </div>
  );
};

export default App;

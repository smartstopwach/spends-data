import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  LayoutDashboard,
  ListOrdered,
  Mail,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CategoryPanel } from './components/CategoryPanel';
import { EntryPanel } from './components/EntryPanel';
import { KpiCards } from './components/KpiCards';
import { TransactionTabsCard } from './components/TransactionTabsCard';
import { RecentPreview } from './components/RecentPreview';
import { ReportSettingsCard } from './components/ReportSettingsCard';
import { TrendCard } from './components/TrendCard';
import { useEmailReport } from './hooks/useEmailReport';
import { useSpendsStore } from './hooks/useSpendsStore';
import { SpendCategory, TransactionType } from './types';
import { buildReport, resolveReportRange } from './utils/weeklyReport';
import {
  exportBackupJSON,
  exportTransactionsToCSV,
  formatMonthLabel,
  getCurrentMonthKey,
  shiftMonthKey,
} from './utils/mathAndFormat';

type View = 'home' | 'transactions' | 'reports';

const readHashView = (): View => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '');
  if (hash === 'ledger' || hash === 'records') return 'transactions';
  return hash === 'transactions' || hash === 'reports' ? hash : 'home';
};

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

  const [view, setView] = useState<View>(readHashView);
  const [activeType, setActiveType] = useState<TransactionType>('spend');
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<SpendCategory | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const { config: reportConfig, update: updateReportConfig, markSent, due } = useEmailReport();

  const currentMonthKey = getCurrentMonthKey();
  const monthLabel = formatMonthLabel(selectedMonth);
  const reportRange = resolveReportRange(reportConfig);
  const reportPreview = useMemo(
    () => buildReport(transactions, { fromISO: reportRange.fromISO, toISO: reportRange.toISO }),
    [transactions, reportRange.fromISO, reportRange.toISO]
  );

  useEffect(() => {
    const onHash = () => setView(readHashView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  const goTo = useCallback((next: View) => {
    setView(next);
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', next === 'home' ? location.pathname : `#${next}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  /** Add entry and make sure the active month shows it right away. */
  const handleAdd = useCallback(
    (tx: Parameters<typeof addTransaction>[0]) => {
      addTransaction(tx);
      const txMonth = tx.date.slice(0, 7);
      if (selectedMonth !== 'all' && txMonth !== selectedMonth) {
        setSelectedMonth(txMonth);
      }
    },
    [addTransaction, selectedMonth, setSelectedMonth]
  );

  const handleQuickAdd = useCallback((mode: TransactionType) => {
    setActiveType(mode);
    setFocusTrigger((n) => n + 1);
    setView('home');
    if (typeof window !== 'undefined') history.replaceState(null, '', location.pathname);
    window.setTimeout(() => {
      document
        .getElementById('entry-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }, []);

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
                Spends Data
              </p>
              <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400 sm:block">
                Expense Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Section nav */}
            <nav className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => goTo('home')}
                aria-current={view === 'home'}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  view === 'home'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-3 w-3" />
                <span className="hidden xs:inline sm:inline">Home</span>
              </button>
              <button
                type="button"
                onClick={() => goTo('transactions')}
                aria-current={view === 'transactions'}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  view === 'transactions'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ListOrdered className="h-3 w-3" />
                <span>Transactions</span>
                <span
                  className={`num rounded px-1 text-[10px] font-bold ${
                    view === 'transactions' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {periodTransactions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => goTo('reports')}
                aria-current={view === 'reports'}
                className={`relative flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  view === 'reports'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">Reports</span>
                {reportConfig.enabled && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                )}
              </button>
            </nav>

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
                {selectedMonth === 'all' ? 'All time' : monthLabel.replace(/ \d{4}$/, '')}
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
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Actions"
              >
                <span className="hidden sm:inline">Actions</span>
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

      {hasDemoEntries && (
        <div className="border-b border-indigo-200 bg-indigo-50/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
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
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6">
        {due && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-amber-900">
              <Bell className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              Your weekly spend report is due — time to send it to {reportConfig.email}.
            </p>
            <button
              type="button"
              onClick={() => goTo('reports')}
              className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-amber-700"
            >
              Send report
            </button>
          </div>
        )}

        {view === 'home' ? (
          <>
            {/* Page header */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                  Overview
                </h1>
                <p className="mt-1 text-[12px] font-medium text-slate-500">
                  {monthLabel} · <span className="num">{periodTransactions.length}</span>{' '}
                  {periodTransactions.length === 1 ? 'entry' : 'entries'} · saved in this browser
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdd('income')}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  + money in
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
              {/* Add entry first on mobile, right column on desktop */}
              <div className="order-1 flex flex-col gap-4 lg:order-2 lg:col-span-4">
                <div id="entry-panel" className="scroll-mt-20">
                  <EntryPanel
                    activeType={activeType}
                    onChangeType={setActiveType}
                    onAdd={handleAdd}
                    focusTrigger={focusTrigger}
                  />
                </div>
              </div>

              <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-8">
                <TrendCard
                  dailySeries={periodAnalytics.dailySeries}
                  spend={periodAnalytics.spend}
                  budget={periodAnalytics.effectiveLimit}
                  budgetUsedPercent={periodAnalytics.budgetUsedPercent}
                  budgetRemaining={periodAnalytics.budgetRemaining}
                  monthLabel={monthLabel}
                  safeDailyAllowance={periodAnalytics.safeDailyAllowance}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <RecentPreview
                    transactions={periodTransactions}
                    onViewAll={() => goTo('transactions')}
                  />
                  <CategoryPanel
                    items={periodAnalytics.categoryBreakdown}
                    totalSpend={periodAnalytics.spend}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </div>
              </div>
            </div>
          </>
        ) : view === 'transactions' ? (
          <>
            {/* ── Transactions — dedicated section ─────────── */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => goTo('home')}
                  className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to overview
                </button>
                <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  <ListOrdered className="h-4 w-4 text-indigo-500" />
                  Recent entries
                </h1>
                <p className="mt-1 text-[12px] font-medium text-slate-500">
                  {monthLabel} · all transactions with filters, search and sorting
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={transactions.length === 0}
                  onClick={() => exportTransactionsToCSV(periodTransactions)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <Download className="h-3 w-3 text-indigo-500" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd('spend')}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  + Add entry
                </button>
              </div>
            </div>

            {/* Period summary strip */}
            <div className="mb-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
              {[
                { label: 'Money in', value: periodAnalytics.income, tone: 'text-emerald-600' },
                { label: 'Money out', value: periodAnalytics.spend, tone: 'text-slate-900' },
                {
                  label: 'Net',
                  value: periodAnalytics.net,
                  tone: periodAnalytics.net >= 0 ? 'text-indigo-600' : 'text-rose-600',
                },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {s.label}
                  </p>
                  <p className={`num mt-1 text-sm font-bold sm:text-base ${s.tone}`}>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(s.value)}
                  </p>
                </div>
              ))}
            </div>

            <TransactionTabsCard
              transactions={periodTransactions}
              selectedCategory={selectedCategory}
              onClearCategory={() => setSelectedCategory('all')}
              onDelete={deleteTransaction}
              onLoadDemo={loadDemoData}
              totalOverallCount={transactions.length}
              monthLabel={monthLabel}
            />
          </>
        ) : (
          <>
            {/* ── Reports — weekly email digest ─────────────── */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => goTo('home')}
                  className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to overview
                </button>
                <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  Reports
                </h1>
                <p className="mt-1 text-[12px] font-medium text-slate-500">
                  Weekly spend summary delivered to your Gmail — choose your address below.
                </p>
              </div>

              <span
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ring-1 ${
                  reportConfig.enabled
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-slate-200'
                }`}
              >
                {reportConfig.enabled ? 'Weekly reports ON' : 'Weekly reports OFF'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ReportSettingsCard
                  config={reportConfig}
                  onChange={updateReportConfig}
                  transactions={transactions}
                  onMarkSent={markSent}
                />
              </div>

              <div className="flex flex-col gap-4 lg:col-span-5">
                <section className="panel p-5">
                  <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
                  <ol className="mt-3 space-y-3">
                    {[
                      {
                        title: 'Add your Gmail',
                        body: 'Only an email address — no password or login. Your data stays in this browser.',
                      },
                      {
                        title: 'Pick a day and time',
                        body: 'You get a reminder on that day each week, with the last 7 days ready to send.',
                      },
                      {
                        title: 'Send now dabayein',
                        body: 'Gmail compose pre-filled khulega — ya EmailJS set karke poora automatic kar dein.',
                      },
                    ].map((step, i) => (
                      <li key={step.title} className="flex gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900">{step.title}</p>
                          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
                            {step.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Privacy
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
                      Spends Data is a static app with no server. Your transactions stay in
                      localStorage, and an email is only created when you press Send yourself.
                    </p>
                  </div>
                </section>

                <section className="panel p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Selected period</h2>
                  <p className="num mt-0.5 text-xs font-medium text-slate-500">
                    {reportRange.label} · {reportRange.days}{' '}
                    {reportRange.days === 1 ? 'day' : 'days'}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: 'Entries', value: String(reportPreview.entryCount) },
                      {
                        label: 'Spends',
                        value: `₹${reportPreview.spend.toLocaleString('en-IN')}`,
                      },
                      {
                        label: 'Money in',
                        value: `₹${reportPreview.income.toLocaleString('en-IN')}`,
                      },
                      {
                        label: 'Daily avg',
                        value: `₹${reportPreview.dailyAvg.toLocaleString('en-IN')}`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {item.label}
                        </dt>
                        <dd className="num mt-0.5 text-[13px] font-bold text-slate-900">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      What the email contains
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[11px] font-medium text-slate-600">
                      <li>• Summary: money in, spends, net, balance</li>
                      <li>• Category-wise breakdown with bars</li>
                      <li>• Day-by-day spending with every entry</li>
                      <li>• Biggest category &amp; biggest single spend</li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-4 text-[11px] font-medium text-slate-400">
          <span>Spends Data · offline-first expense tracker</span>
          <span className="num">
            {transactions.length} total records · balance{' '}
            {walletSummary.balance >= 0 ? 'positive' : 'negative'}
          </span>
        </footer>
      </main>
    </div>
  );
};

export default App;

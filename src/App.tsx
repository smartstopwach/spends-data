import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles, X } from 'lucide-react';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { BalanceHero } from './components/BalanceHero';
import { Header } from './components/Header';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { useSpendsStore } from './hooks/useSpendsStore';
import { SpendCategory, TransactionType } from './types';
import { exportBackupJSON, exportTransactionsToCSV } from './utils/mathAndFormat';

export const App: React.FC = () => {
  const {
    transactions,
    periodTransactions,
    selectedMonth,
    setSelectedMonth,
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
  } = useSpendsStore();

  const [activeFormType, setActiveFormType] = useState<TransactionType>('spend');
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SpendCategory | 'all'>('all');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const handleQuickSwitchMode = (mode: TransactionType) => {
    setActiveFormType(mode);
    setFocusTrigger((n) => n + 1);
    const el = document.getElementById('entry-form-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleImportBackup = (rawJson: string) => {
    const res = importBackupData(rawJson);
    setBannerNotice(res.message);
    window.setTimeout(() => setBannerNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-12">
      <Header
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => {
          setSelectedMonth(m);
          setSelectedCategoryFilter('all');
        }}
        onExportCSV={() => exportTransactionsToCSV(transactions)}
        onExportBackup={() => exportBackupJSON(transactions, budgets)}
        onImportBackup={handleImportBackup}
        onLoadDemo={loadDemoData}
        onClearAll={clearAllData}
        transactionCount={transactions.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Import / System Notice */}
        {bannerNotice && (
          <div className="rounded-xl bg-slate-900 text-white px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
            <span>{bannerNotice}</span>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Friendly Demo Strip */}
        {hasDemoEntries && (
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Demo Preview:</strong> Sample entries dikh rahi hain taaki aap analytics & charts dekh sakein. Apna asli hisaab rakhne ke liye sample hatayein.
              </span>
            </div>
            <button
              type="button"
              onClick={clearDemoTransactions}
              className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Clear Sample Data (Start ₹0)
            </button>
          </div>
        )}

        {/* Top KPI Summary Cards */}
        <BalanceHero
          walletBalance={walletSummary.balance}
          cashBalance={walletSummary.cashBalance}
          digitalBalance={walletSummary.digitalBalance}
          periodIncome={periodAnalytics.income}
          homeOnlyIncome={periodAnalytics.homeOnlyIncome}
          periodSpend={periodAnalytics.spend}
          incomeCount={periodAnalytics.incomeCount}
          spendCount={periodAnalytics.spendCount}
          dailyAvgSpend={periodAnalytics.dailyAvgSpend}
          safeDailyAllowance={periodAnalytics.safeDailyAllowance}
          remainingDays={periodAnalytics.remainingDays}
          selectedMonth={selectedMonth}
          onQuickSwitchMode={handleQuickSwitchMode}
        />

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Add Spend / Add Ghar ka Paisa / Calculator */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <TransactionForm
              activeType={activeFormType}
              onChangeType={setActiveFormType}
              onAddSingle={addTransaction}
              onAddMultiple={addMultipleTransactions}
              focusTrigger={focusTrigger}
            />
          </div>

          {/* Right Column: Monthly Analytics + Transaction History */}
          <div className="lg:col-span-7 space-y-6">
            <AnalyticsPanel
              selectedMonth={selectedMonth}
              activeMonthKey={periodAnalytics.activeMonthKey}
              periodIncome={periodAnalytics.income}
              periodSpend={periodAnalytics.spend}
              periodNet={periodAnalytics.net}
              configuredBudget={periodAnalytics.configuredBudget}
              effectiveLimit={periodAnalytics.effectiveLimit}
              budgetRemaining={periodAnalytics.budgetRemaining}
              budgetUsedPercent={periodAnalytics.budgetUsedPercent}
              safeDailyAllowance={periodAnalytics.safeDailyAllowance}
              remainingDays={periodAnalytics.remainingDays}
              dailyAvgSpend={periodAnalytics.dailyAvgSpend}
              categoryBreakdown={periodAnalytics.categoryBreakdown}
              dailySeries={periodAnalytics.dailySeries}
              selectedCategoryFilter={selectedCategoryFilter}
              onSelectCategoryFilter={setSelectedCategoryFilter}
              onUpdateBudget={setBudgetForMonth}
            />

            <TransactionList
              transactions={periodTransactions}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter('all')}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
              onLoadDemo={loadDemoData}
              totalOverallCount={transactions.length}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Quick Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleQuickSwitchMode('spend')}
          className="py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>- Spend Add Karein</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickSwitchMode('income')}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>+ Ghar Ka Paisa</span>
        </button>
      </div>
    </div>
  );
};

export default App;

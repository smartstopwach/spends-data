import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BentoSummaryCards } from './components/BentoSummaryCards';
import { CategoryCards } from './components/CategoryCards';
import { HistoryCard } from './components/HistoryCard';
import { QuickAddCard } from './components/QuickAddCard';
import { useSpendsStore } from './hooks/useSpendsStore';
import { SpendCategory, TransactionType } from './types';
import {
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

  const handleQuickAdd = (mode: TransactionType) => {
    setActiveType(mode);
    setFocusTrigger((n) => n + 1);
    const el = document.getElementById('entry-form-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const shortMonth =
    selectedMonth === 'all'
      ? 'All Time'
      : new Date(
          Number(selectedMonth.split('-')[0]),
          Number(selectedMonth.split('-')[1]) - 1,
          1
        ).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-zinc-900 py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Minimal Aesthetic Top Bar */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-emerald-400 font-extrabold text-xl flex items-center justify-center shadow-xs select-none">
              ₹
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 leading-tight">
                GharKaHisaab
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                Simple Paisa & Spends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimal Pill Month Switcher */}
            <div className="inline-flex items-center bg-white border border-black/[0.06] rounded-full p-1 shadow-2xs">
              {selectedMonth !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(shiftMonthKey(selectedMonth, -1));
                    setSelectedCategory('all');
                  }}
                  className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(selectedMonth === 'all' ? currentMonthKey : 'all');
                  setSelectedCategory('all');
                }}
                title={`${formatMonthLabel(selectedMonth)} (Click to toggle All Time)`}
                className="px-2.5 py-1 text-xs font-bold text-zinc-800 cursor-pointer whitespace-nowrap"
              >
                {shortMonth}
              </button>

              {selectedMonth !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(shiftMonthKey(selectedMonth, 1));
                    setSelectedCategory('all');
                  }}
                  className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Minimal Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-white border border-black/[0.06] text-zinc-600 hover:text-zinc-900 flex items-center justify-center shadow-2xs cursor-pointer"
                aria-label="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-zinc-200/80 shadow-xl py-1.5 z-40">
                    <button
                      type="button"
                      disabled={transactions.length === 0}
                      onClick={() => {
                        exportTransactionsToCSV(transactions);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Excel / CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        loadDemoData();
                        setMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Load Sample Cards</span>
                    </button>

                    <button
                      type="button"
                      disabled={transactions.length === 0}
                      onClick={() => {
                        clearAllData();
                        setMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All (Start ₹0)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Subtle 1-Line Sample Pill */}
        {hasDemoEntries && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-full bg-white/80 border border-black/[0.06] text-xs">
            <span className="text-zinc-600 font-medium truncate">
              Sample preview dikh raha hai
            </span>
            <button
              type="button"
              onClick={clearDemoTransactions}
              className="px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold shrink-0 transition cursor-pointer"
            >
              Start Fresh (₹0)
            </button>
          </div>
        )}

        {/* 1. Aesthetic Bento Balance Cards */}
        <BentoSummaryCards
          walletBalance={walletSummary.balance}
          periodIncome={periodAnalytics.income}
          periodSpend={periodAnalytics.spend}
          dailyAvgSpend={periodAnalytics.dailyAvgSpend}
          onQuickAdd={handleQuickAdd}
        />

        {/* 2. Ultra-Simple Quick Add + Math Spend Calculator Card */}
        <QuickAddCard
          activeType={activeType}
          onChangeType={setActiveType}
          onAdd={addTransaction}
          focusTrigger={focusTrigger}
        />

        {/* 3. Aesthetic Category Mini-Cards */}
        <CategoryCards
          items={periodAnalytics.categoryBreakdown}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* 4. Sleek Recent Hisaab Card */}
        <HistoryCard
          transactions={periodTransactions}
          selectedCategory={selectedCategory}
          onDelete={deleteTransaction}
          onLoadDemo={loadDemoData}
          totalOverallCount={transactions.length}
        />
      </div>
    </div>
  );
};

export default App;

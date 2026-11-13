import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Check,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  INCOME_QUICK_AMOUNTS,
  INCOME_SOURCES,
  PAYMENT_MODES,
  SPEND_CATEGORIES,
  SPEND_QUICK_AMOUNTS,
} from '../constants';
import { NewTransactionInput } from '../hooks/useSpendsStore';
import { IncomeSource, PaymentMode, SpendCategory, TransactionType } from '../types';
import { evaluateAmountExpression, formatINR, getTodayISO } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface TransactionFormProps {
  activeType: TransactionType;
  onChangeType: (type: TransactionType) => void;
  onAddSingle: (tx: NewTransactionInput) => void;
  onAddMultiple: (txs: NewTransactionInput[]) => void;
  focusTrigger: number;
}

interface CalcRow {
  id: string;
  label: string;
  amountStr: string;
  category: SpendCategory;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  activeType,
  onChangeType,
  onAddSingle,
  onAddMultiple,
  focusTrigger,
}) => {
  const [entryStyle, setEntryStyle] = useState<'single' | 'multi'>('single');
  const [amountRaw, setAmountRaw] = useState('');
  const [spendCategory, setSpendCategory] = useState<SpendCategory>('food');
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('home');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [date, setDate] = useState<string>(() => getTodayISO());
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Multi-item Spend Calculator rows
  const [calcRows, setCalcRows] = useState<CalcRow[]>([
    { id: 'r1', label: '', amountStr: '', category: 'food' },
    { id: 'r2', label: '', amountStr: '', category: 'travel' },
  ]);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusTrigger > 0) {
      amountInputRef.current?.focus();
    }
  }, [focusTrigger]);

  const evalResult = evaluateAmountExpression(amountRaw);
  const quickChips = activeType === 'spend' ? SPEND_QUICK_AMOUNTS : INCOME_QUICK_AMOUNTS;

  const showToast = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => {
      setFeedback((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const handleQuickChip = (val: number) => {
    setAmountRaw((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return String(val);
      const parsed = evaluateAmountExpression(trimmed);
      if (parsed.valid && parsed.value !== null && !parsed.isExpression) {
        return String(Math.round((parsed.value + val) * 100) / 100);
      }
      return `${trimmed}+${val}`;
    });
    amountInputRef.current?.focus();
  };

  const handleOperatorTap = (op: string) => {
    setAmountRaw((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return '';
      if (/[+\-*/×÷]$/.test(trimmed)) {
        return trimmed.slice(0, -1) + op;
      }
      return trimmed + op;
    });
    amountInputRef.current?.focus();
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalResult.valid || evalResult.value === null) return;

    const category = activeType === 'spend' ? spendCategory : incomeSource;
    const defaultNote =
      note.trim() ||
      (activeType === 'income'
        ? INCOME_SOURCES.find((s) => s.id === incomeSource)?.label || 'Ghar se paisa'
        : SPEND_CATEGORIES.find((c) => c.id === spendCategory)?.label || 'Spend');

    onAddSingle({
      type: activeType,
      amount: evalResult.value,
      category,
      paymentMode,
      date: date || getTodayISO(),
      note: defaultNote,
    });

    const formatted = formatINR(evalResult.value);
    showToast(
      activeType === 'income'
        ? `${formatted} wallet mein add ho gaya!`
        : `${formatted} spend add ho gaya!`
    );
    setAmountRaw('');
    setNote('');
  };

  // Multi-item calculator totals
  const parsedCalcRows = calcRows.map((row) => {
    const res = evaluateAmountExpression(row.amountStr);
    return {
      ...row,
      numericAmount: res.valid && res.value !== null ? res.value : 0,
    };
  });

  const validCalcRows = parsedCalcRows.filter((r) => r.numericAmount > 0);
  const multiTotal = Math.round(
    validCalcRows.reduce((sum, r) => sum + r.numericAmount, 0) * 100
  ) / 100;

  const updateCalcRow = (id: string, patch: Partial<CalcRow>) => {
    setCalcRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addCalcRow = () => {
    setCalcRows((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, label: '', amountStr: '', category: spendCategory },
    ]);
  };

  const removeCalcRow = (id: string) => {
    if (calcRows.length <= 2) {
      updateCalcRow(id, { label: '', amountStr: '' });
      return;
    }
    setCalcRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveMultiCombined = () => {
    if (validCalcRows.length === 0 || multiTotal <= 0) return;
    const summaryNote = validCalcRows
      .map((r, idx) => `${r.label.trim() || `Item ${idx + 1}`} (${formatINR(r.numericAmount)})`)
      .join(', ');

    onAddSingle({
      type: 'spend',
      amount: multiTotal,
      category: validCalcRows[0].category,
      paymentMode,
      date: date || getTodayISO(),
      note: summaryNote,
    });

    showToast(`Total ${formatINR(multiTotal)} spend add ho gaya!`);
    setCalcRows([
      { id: 'r1', label: '', amountStr: '', category: 'food' },
      { id: 'r2', label: '', amountStr: '', category: 'travel' },
    ]);
  };

  const handleSaveMultiSeparate = () => {
    if (validCalcRows.length === 0) return;
    const inputs: NewTransactionInput[] = validCalcRows.map((r) => ({
      type: 'spend',
      amount: r.numericAmount,
      category: r.category,
      paymentMode,
      date: date || getTodayISO(),
      note:
        r.label.trim() ||
        SPEND_CATEGORIES.find((c) => c.id === r.category)?.label ||
        'Spend',
    }));

    onAddMultiple(inputs);
    showToast(`${inputs.length} spends (${formatINR(multiTotal)}) add ho gaye!`);
    setCalcRows([
      { id: 'r1', label: '', amountStr: '', category: 'food' },
      { id: 'r2', label: '', amountStr: '', category: 'travel' },
    ]);
  };

  const isIncome = activeType === 'income';

  return (
    <div
      id="entry-form-card"
      className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden"
    >
      {/* Top Mode Switcher: Spend vs Ghar se Paisa */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200/70 gap-1.5">
        <button
          type="button"
          onClick={() => {
            onChangeType('spend');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition cursor-pointer ${
            !isIncome
              ? 'bg-white text-rose-600 shadow-xs ring-1 ring-rose-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Kharcha / Spend (-)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeType('income');
            setEntryStyle('single');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition cursor-pointer ${
            isIncome
              ? 'bg-white text-emerald-600 shadow-xs ring-1 ring-emerald-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Ghar Se Paisa (+)</span>
        </button>
      </div>

      <div className="p-5">
        {/* Subheader + Calculator Mode Switch (for Spends) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isIncome
                ? 'Ghar se Aaya Paisa Add Karein'
                : entryStyle === 'multi'
                ? 'Multi-Spend Calculator (Hisaab Jodein)'
                : 'Naya Spend / Kharcha Likhein'}
            </h2>
            <p className="text-xs text-slate-500">
              {isIncome
                ? 'Wallet balance mein turant jud jayega'
                : entryStyle === 'multi'
                ? 'Kai chhote kharche ek saath calculate karke save karein'
                : 'Amount mein seedha 40+25+60 bhi likh sakte hain'}
            </p>
          </div>

          {!isIncome && (
            <button
              type="button"
              onClick={() => setEntryStyle((s) => (s === 'single' ? 'multi' : 'single'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
                entryStyle === 'multi'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{entryStyle === 'multi' ? 'Single Entry' : 'Hisaab Calc'}</span>
            </button>
          )}
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              isIncome
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-900 text-white'
            }`}
          >
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{feedback}</span>
          </div>
        )}

        {entryStyle === 'single' || isIncome ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            {/* Smart Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="amount-input"
                  className="text-xs font-semibold text-slate-700"
                >
                  Amount (₹) {isIncome ? 'Kitna Aaya' : 'ya Math (e.g. 40+25)'}
                </label>

                {/* Mini Operator Pad */}
                <div className="flex items-center gap-1">
                  {['+', '-', '×', '÷'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleOperatorTap(op)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition cursor-pointer"
                      title={`Insert ${op}`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold ${
                    isIncome ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ₹
                </span>
                <input
                  id="amount-input"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value)}
                  placeholder={isIncome ? '5000' : '120 ya 40+30+50'}
                  className={`w-full pl-9 pr-24 py-3 rounded-xl border text-lg font-bold tabular-nums text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 transition ${
                    isIncome
                      ? 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
                  }`}
                />

                {amountRaw && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {evalResult.isExpression && evalResult.valid && evalResult.value !== null && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold tabular-nums">
                        = {formatINR(evalResult.value)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setAmountRaw('')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      aria-label="Clear amount"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {amountRaw && !evalResult.valid && evalResult.error && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{evalResult.error}</p>
              )}

              {/* Quick Preset Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickChips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickChip(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer tabular-nums ${
                      isIncome
                        ? 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 border-emerald-200/70'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Category / Source Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {isIncome ? 'Kahan se aaya? (Source)' : 'Kis cheez pe kharch hua? (Category)'}
              </label>

              {isIncome ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INCOME_SOURCES.map((src) => {
                    const active = incomeSource === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setIncomeSource(src.id as IncomeSource)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          active
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`p-1.5 rounded-lg ${src.bgClass} ${src.textClass}`}>
                          <CategoryIcon name={src.iconName} className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-semibold leading-tight truncate">
                          {src.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                  {SPEND_CATEGORIES.map((cat) => {
                    const active = spendCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSpendCategory(cat.id as SpendCategory)}
                        className={`flex flex-col items-start gap-1.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          active
                            ? 'bg-rose-50/70 border-rose-500 text-slate-900 ring-1 ring-rose-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`p-1.5 rounded-lg ${cat.bgClass} ${cat.textClass}`}>
                          <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-semibold leading-tight truncate w-full">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Mode & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {PAYMENT_MODES.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMode(pm.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer truncate ${
                        paymentMode === pm.id
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {pm.id === 'bank' ? 'Bank' : pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="tx-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Date (Tareekh)
                </label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label
                htmlFor="tx-note"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Note / Detail (Optional)
              </label>
              <input
                id="tx-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isIncome
                    ? 'e.g., Papa ne monthly pocket money bheja'
                    : 'e.g., Subah auto + kulhad chai'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!evalResult.valid || evalResult.value === null}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {isIncome ? (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    {evalResult.valid && evalResult.value
                      ? `${formatINR(evalResult.value, true)} Wallet Mein Jodein`
                      : 'Ghar Ka Paisa Add Karein'}
                  </span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>
                    {evalResult.valid && evalResult.value
                      ? `${formatINR(evalResult.value)} Spend Save Karein`
                      : 'Spend Add Karein'}
                  </span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* MULTI-ITEM SPEND CALCULATOR ("Hisaab Jodein") */
          <div className="space-y-4">
            <div className="space-y-2.5">
              {calcRows.map((row, index) => {
                const rowEval = evaluateAmountExpression(row.amountStr);
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/70"
                  >
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateCalcRow(row.id, { label: e.target.value })}
                      placeholder={`Item ${index + 1} (e.g. Auto / Chai)`}
                      className="col-span-5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                    <select
                      value={row.category}
                      onChange={(e) =>
                        updateCalcRow(row.id, { category: e.target.value as SpendCategory })
                      }
                      aria-label="Item Category"
                      className="col-span-3 px-2 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400"
                    >
                      {SPEND_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="col-span-3 relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.amountStr}
                        onChange={(e) => updateCalcRow(row.id, { amountStr: e.target.value })}
                        placeholder="₹0"
                        className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold tabular-nums text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400"
                      />
                      {rowEval.isExpression && rowEval.valid && rowEval.value !== null && (
                        <span className="block text-[10px] text-indigo-600 font-semibold mt-0.5 tabular-nums">
                          = {formatINR(rowEval.value)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCalcRow(row.id)}
                      className="col-span-1 flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addCalcRow}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aur Item Jodein (+ Add Row)</span>
            </button>

            {/* Shared Payment Mode + Date */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {PAYMENT_MODES.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMode(pm.id)}
                    className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      paymentMode === pm.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {pm.id === 'bank' ? 'Bank' : pm.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>

            {/* Live Total Box */}
            <div className="rounded-xl bg-indigo-50/80 border border-indigo-200/80 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-900">
                  Calculated Total ({validCalcRows.length} items)
                </p>
                <p className="text-[11px] text-indigo-600">
                  Save karte hi wallet balance se minus ho jayega
                </p>
              </div>
              <p className="text-xl font-extrabold text-indigo-950 tabular-nums">
                {formatINR(multiTotal)}
              </p>
            </div>

            {/* Save Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={multiTotal <= 0}
                onClick={handleSaveMultiCombined}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Combined ({formatINR(multiTotal)})</span>
              </button>

              <button
                type="button"
                disabled={validCalcRows.length === 0}
                onClick={handleSaveMultiSeparate}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Save {validCalcRows.length || ''} Alag Spends</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

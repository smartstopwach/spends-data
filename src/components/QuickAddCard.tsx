import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Plus, X } from 'lucide-react';
import { NewTransactionInput } from '../hooks/useSpendsStore';
import { IncomeSource, SpendCategory, TransactionType } from '../types';
import { evaluateAmountExpression, formatINR, getTodayISO } from '../utils/mathAndFormat';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddCardProps {
  activeType: TransactionType;
  onChangeType: (type: TransactionType) => void;
  onAdd: (tx: NewTransactionInput) => void;
  focusTrigger: number;
}

const SPEND_TILES: Array<{ id: SpendCategory; label: string; icon: string }> = [
  { id: 'food', label: 'Food & Chai', icon: 'Utensils' },
  { id: 'travel', label: 'Travel', icon: 'Bus' },
  { id: 'rent', label: 'Rent / Mess', icon: 'Home' },
  { id: 'groceries', label: 'Daily Needs', icon: 'ShoppingBag' },
  { id: 'study', label: 'Study / Bills', icon: 'BookOpen' },
  { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

const INCOME_TILES: Array<{ id: IncomeSource; label: string; icon: string }> = [
  { id: 'home', label: 'Ghar Se', icon: 'HeartHandshake' },
  { id: 'family_gift', label: 'Gift', icon: 'Gift' },
  { id: 'carryover', label: 'Other', icon: 'Wallet' },
];

export const QuickAddCard: React.FC<QuickAddCardProps> = ({
  activeType,
  onChangeType,
  onAdd,
  focusTrigger,
}) => {
  const [amountRaw, setAmountRaw] = useState('');
  const [spendCat, setSpendCat] = useState<SpendCategory>('food');
  const [incomeSrc, setIncomeSrc] = useState<IncomeSource>('home');
  const [date, setDate] = useState<string>(() => getTodayISO());
  const [note, setNote] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusTrigger > 0) {
      inputRef.current?.focus();
    }
  }, [focusTrigger]);

  const isIncome = activeType === 'income';
  const evalResult = evaluateAmountExpression(amountRaw);
  const quickAmounts = isIncome ? [500, 1000, 2000, 5000] : [50, 100, 200, 500];

  const handleChipAdd = (val: number) => {
    setAmountRaw((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return String(val);
      const parsed = evaluateAmountExpression(trimmed);
      if (parsed.valid && parsed.value !== null && !parsed.isExpression) {
        return String(Math.round((parsed.value + val) * 100) / 100);
      }
      return `${trimmed}+${val}`;
    });
    inputRef.current?.focus();
  };

  const handlePlusOperator = () => {
    setAmountRaw((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || /[+\-*/×÷]$/.test(trimmed)) return trimmed;
      return `${trimmed}+`;
    });
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalResult.valid || evalResult.value === null) return;

    const chosenLabel = isIncome
      ? INCOME_TILES.find((p) => p.id === incomeSrc)?.label || 'Ghar se aaya'
      : SPEND_TILES.find((p) => p.id === spendCat)?.label || 'Spend';

    onAdd({
      type: activeType,
      amount: evalResult.value,
      category: isIncome ? incomeSrc : spendCat,
      paymentMode: 'upi',
      date: date || getTodayISO(),
      note: note.trim() || chosenLabel,
    });

    const msg = isIncome
      ? `+${formatINR(evalResult.value)} wallet mein add hua`
      : `-${formatINR(evalResult.value)} spend add hua`;
    setSavedMsg(msg);
    window.setTimeout(() => setSavedMsg((m) => (m === msg ? null : m)), 2200);
    setAmountRaw('');
    setNote('');
  };

  return (
    <section id="entry-form-card" className="rounded-3xl bento-card p-5 sm:p-6">
      {/* Symmetrical 2-Column Mode Switch */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-zinc-100 mb-4">
        <button
          type="button"
          onClick={() => onChangeType('spend')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            !isIncome
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" />
          <span>Spend (-)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeType('income')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            isIncome
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0" />
          <span>Ghar Ka Paisa (+)</span>
        </button>
      </div>

      {savedMsg && (
        <div className="mb-4 px-3.5 py-2 rounded-2xl bg-zinc-900 text-white text-xs font-semibold flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clean Amount Input + Math Calculator */}
        <div
          className={`rounded-2xl p-4 border transition ${
            isIncome
              ? 'bg-emerald-50/40 border-emerald-200/80 focus-within:border-emerald-500 focus-within:bg-white'
              : 'bg-zinc-50/90 border-zinc-200/80 focus-within:border-zinc-900 focus-within:bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-zinc-500 mb-1">
            <span>{isIncome ? 'Amount (₹)' : 'Amount ya Hisaab (e.g. 40+30)'}</span>
            {evalResult.isExpression && evalResult.valid && evalResult.value !== null && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white font-bold tabular-nums">
                = {formatINR(evalResult.value)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold select-none ${
                isIncome ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ₹
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              placeholder="0"
              aria-label="Amount in Rupees"
              className="w-full min-w-0 bg-transparent text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
            />

            {!isIncome && amountRaw && (
              <button
                type="button"
                onClick={handlePlusOperator}
                title="Add another item (+)"
                className="w-8 h-8 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 font-bold text-sm flex items-center justify-center shrink-0 transition cursor-pointer"
              >
                +
              </button>
            )}

            {amountRaw && (
              <button
                type="button"
                onClick={() => setAmountRaw('')}
                className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Clear amount"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {amountRaw && !evalResult.valid && evalResult.error && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">{evalResult.error}</p>
          )}

          {/* Symmetrical 4-Col Quick Add Chips */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleChipAdd(amt)}
                className="py-1.5 px-2 rounded-xl bg-white border border-zinc-200/90 hover:border-zinc-400 active:scale-95 text-xs font-bold text-zinc-700 transition tabular-nums cursor-pointer text-center"
              >
                +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Symmetrical 3-Col Category Grid */}
        <div className="grid grid-cols-3 gap-2">
          {(isIncome ? INCOME_TILES : SPEND_TILES).map((tile) => {
            const active = isIncome ? incomeSrc === tile.id : spendCat === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() =>
                  isIncome
                    ? setIncomeSrc(tile.id as IncomeSource)
                    : setSpendCat(tile.id as SpendCategory)
                }
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                  active
                    ? isIncome
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50/80 text-zinc-700 border-zinc-200/70 hover:bg-zinc-100'
                }`}
              >
                <CategoryIcon name={tile.icon} className="w-4 h-4" />
                <span className="truncate max-w-full text-[11px] sm:text-xs">{tile.label}</span>
              </button>
            );
          })}
        </div>

        {/* Note + Compact Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isIncome ? 'Note (e.g. Papa ne bheja)' : 'Note (e.g. Auto + Chai)'}
            className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 transition"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="px-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-zinc-700 focus:outline-none focus:bg-white focus:border-zinc-400 transition"
          />
        </div>

        {/* Full-Width Primary CTA */}
        <button
          type="submit"
          disabled={!evalResult.valid || evalResult.value === null}
          className={`w-full h-12 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${
            isIncome
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>
            {evalResult.valid && evalResult.value
              ? isIncome
                ? `${formatINR(evalResult.value, true)} Wallet Mein Add Karein`
                : `${formatINR(evalResult.value)} Spend Save Karein`
              : isIncome
              ? 'Ghar Ka Paisa Add Karein'
              : 'Spend Add Karein'}
          </span>
        </button>
      </form>
    </section>
  );
};

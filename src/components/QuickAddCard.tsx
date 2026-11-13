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

const SIMPLE_SPEND_PILLS: Array<{ id: SpendCategory; label: string; icon: string }> = [
  { id: 'food', label: 'Food & Chai', icon: 'Utensils' },
  { id: 'travel', label: 'Travel', icon: 'Bus' },
  { id: 'rent', label: 'Rent & Mess', icon: 'Home' },
  { id: 'groceries', label: 'Daily Needs', icon: 'ShoppingBag' },
  { id: 'study', label: 'Study & Bills', icon: 'BookOpen' },
  { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

const SIMPLE_INCOME_PILLS: Array<{ id: IncomeSource; label: string; icon: string }> = [
  { id: 'home', label: 'Ghar Se Aaya', icon: 'HeartHandshake' },
  { id: 'family_gift', label: 'Gift / Relative', icon: 'Gift' },
  { id: 'carryover', label: 'Other / Bachat', icon: 'Wallet' },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalResult.valid || evalResult.value === null) return;

    const chosenLabel = isIncome
      ? SIMPLE_INCOME_PILLS.find((p) => p.id === incomeSrc)?.label || 'Ghar se aaya'
      : SIMPLE_SPEND_PILLS.find((p) => p.id === spendCat)?.label || 'Spend';

    onAdd({
      type: activeType,
      amount: evalResult.value,
      category: isIncome ? incomeSrc : spendCat,
      paymentMode: 'upi',
      date: getTodayISO(),
      note: note.trim() || chosenLabel,
    });

    const msg = isIncome
      ? `+${formatINR(evalResult.value)} add ho gaya!`
      : `-${formatINR(evalResult.value)} spend calculate ho gaya!`;
    setSavedMsg(msg);
    window.setTimeout(() => setSavedMsg((m) => (m === msg ? null : m)), 2200);
    setAmountRaw('');
    setNote('');
  };

  return (
    <section
      id="entry-form-card"
      className="rounded-[28px] bg-white border border-black/[0.06] p-6 sm:p-7 aesthetic-card"
    >
      {/* Clean Pill Mode Toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="inline-flex p-1 rounded-full bg-zinc-100">
          <button
            type="button"
            onClick={() => onChangeType('spend')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
              !isIncome
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Spend (-)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeType('income')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
              isIncome
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Ghar Se Paisa (+)</span>
          </button>
        </div>

        {savedMsg && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {savedMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Big Clean Amount Box (Supports Math like 40+30+50) */}
        <div
          className={`rounded-2xl p-4 border transition ${
            isIncome
              ? 'bg-emerald-50/40 border-emerald-200/70 focus-within:border-emerald-500'
              : 'bg-zinc-50/80 border-zinc-200/80 focus-within:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1">
            <span>{isIncome ? 'Kitna paisa aaya?' : 'Kitna kharch hua? (e.g. 120 ya 40+30)'}</span>
            {evalResult.isExpression && evalResult.valid && evalResult.value !== null && (
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-bold tabular-nums">
                Total = {formatINR(evalResult.value)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-3xl font-extrabold ${
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
              className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
            />
            {amountRaw && (
              <button
                type="button"
                onClick={() => setAmountRaw('')}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 cursor-pointer"
                aria-label="Clear amount"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Amount Pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleChipAdd(amt)}
                className="px-3 py-1 rounded-full bg-white border border-zinc-200/90 hover:border-zinc-400 text-xs font-bold text-zinc-700 transition tabular-nums cursor-pointer"
              >
                +₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Aesthetic Category Pills */}
        <div className="flex flex-wrap gap-2">
          {isIncome
            ? SIMPLE_INCOME_PILLS.map((pill) => {
                const active = incomeSrc === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setIncomeSrc(pill.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100'
                    }`}
                  >
                    <CategoryIcon name={pill.icon} className="w-3.5 h-3.5" />
                    <span>{pill.label}</span>
                  </button>
                );
              })
            : SIMPLE_SPEND_PILLS.map((pill) => {
                const active = spendCat === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSpendCat(pill.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200/80 hover:bg-zinc-100'
                    }`}
                  >
                    <CategoryIcon name={pill.icon} className="w-3.5 h-3.5" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
        </div>

        {/* Short Note + Primary Action */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isIncome ? 'Note (e.g. Papa ne bheja)...' : 'Note (e.g. Chai, Auto, Rent)...'}
            className="flex-1 px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 transition"
          />

          <button
            type="submit"
            disabled={!evalResult.valid || evalResult.value === null}
            className={`px-6 py-3 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                : 'bg-zinc-900 hover:bg-zinc-800 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {evalResult.valid && evalResult.value
                ? `${isIncome ? 'Add' : 'Spend'} ${formatINR(evalResult.value)}`
                : isIncome
                ? 'Add Paisa'
                : 'Add Spend'}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};

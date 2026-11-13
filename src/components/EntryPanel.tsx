import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, CornerDownLeft, Plus } from 'lucide-react';
import { INCOME_SOURCES, SPEND_CATEGORIES } from '../constants';
import { NewTransactionInput } from '../hooks/useSpendsStore';
import { IncomeSource, PaymentMode, SpendCategory, TransactionType } from '../types';
import {
  evaluateAmountExpression,
  formatINR,
  getTodayISO,
  shiftISODate,
} from '../utils/mathAndFormat';
import { useTodayISO } from '../hooks/useTodayISO';
import { CategoryIcon } from './CategoryIcon';

interface EntryPanelProps {
  activeType: TransactionType;
  onChangeType: (type: TransactionType) => void;
  onAdd: (tx: NewTransactionInput) => void;
  focusTrigger: number;
}

const MODES: Array<{ id: PaymentMode; label: string }> = [
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank' },
];

export const EntryPanel: React.FC<EntryPanelProps> = React.memo(
  ({ activeType, onChangeType, onAdd, focusTrigger }) => {
    const today = useTodayISO();
    const [amountRaw, setAmountRaw] = useState('');
    const [spendCat, setSpendCat] = useState<SpendCategory>('food');
    const [incomeSrc, setIncomeSrc] = useState<IncomeSource>('home');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
    const [date, setDate] = useState<string>(() => getTodayISO());
    const [dateTouched, setDateTouched] = useState(false);
    const [note, setNote] = useState('');
    const [saved, setSaved] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (focusTrigger > 0) inputRef.current?.focus();
    }, [focusTrigger]);

    // Keep the date locked to the real "today" unless a date was picked manually.
    useEffect(() => {
      if (!dateTouched) setDate(today);
    }, [today, dateTouched]);

    const isIncome = activeType === 'income';
    const evaluated = evaluateAmountExpression(amountRaw);
    const categories = useMemo(
      () => (isIncome ? INCOME_SOURCES : SPEND_CATEGORIES),
      [isIncome]
    );
    const quickAmounts = isIncome ? [500, 1000, 2000, 5000] : [50, 100, 200, 500];

    const applyChip = (value: number) => {
      setAmountRaw((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return String(value);
        const parsed = evaluateAmountExpression(trimmed);
        if (parsed.valid && parsed.value !== null && !parsed.isExpression) {
          return String(Math.round((parsed.value + value) * 100) / 100);
        }
        return `${trimmed}+${value}`;
      });
      inputRef.current?.focus();
    };

    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!evaluated.valid || evaluated.value === null) return;

      const label = isIncome
        ? INCOME_SOURCES.find((c) => c.id === incomeSrc)?.label
        : SPEND_CATEGORIES.find((c) => c.id === spendCat)?.label;

      onAdd({
        type: activeType,
        amount: evaluated.value,
        category: isIncome ? incomeSrc : spendCat,
        paymentMode,
        date: date || getTodayISO(),
        note: note.trim() || label || 'Entry',
      });

      const formatted = formatINR(evaluated.value);
      const dayNote =
        date === today ? 'today' : date === shiftISODate(today, -1) ? 'yesterday' : date;
      const msg = `${isIncome ? '+' : '−'}${formatted} added to ${
        isIncome ? 'wallet' : 'spends'
      } · ${dayNote}`;
      setSaved(msg);
      window.setTimeout(() => setSaved((m) => (m === msg ? null : m)), 2400);
      setAmountRaw('');
      setNote('');
      setDateTouched(false);
      setDate(today);
      inputRef.current?.focus();
    };

    const disabled = !evaluated.valid || evaluated.value === null;

    return (
      <section aria-label="Add entry" className="panel flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200/80 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">New Entry</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Inline math supported — try 40+30+50
            </p>
          </div>
          <span className="flex h-7 items-center rounded-md bg-slate-100 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {isIncome ? 'Credit' : 'Debit'}
          </span>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          {/* Type switch */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeType('spend')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                !isIncome
                  ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Spend
            </button>
            <button
              type="button"
              onClick={() => onChangeType('income')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                isIncome
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Money In
            </button>
          </div>

          {/* Amount */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="amount" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Amount (₹)
              </label>
              {evaluated.isExpression && evaluated.valid && evaluated.value !== null && (
                <span className="num rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                  = {formatINR(evaluated.value)}
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition ${
                amountRaw && !evaluated.valid
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100'
              }`}
            >
              <span className="text-lg font-bold text-slate-400">₹</span>
              <input
                id="amount"
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="0"
                autoComplete="off"
                className="num w-full min-w-0 bg-transparent text-2xl font-bold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
              {amountRaw && (
                <button
                  type="button"
                  onClick={() => setAmountRaw('')}
                  className="rounded p-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {amountRaw && !evaluated.valid && evaluated.error && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{evaluated.error}</p>
            )}

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => applyChip(amt)}
                  className="num rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 active:scale-[0.98]"
                >
                  +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {isIncome ? 'Source' : 'Category (savings counts as a spend)'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => {
                const active = isIncome ? incomeSrc === c.id : spendCat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      isIncome
                        ? setIncomeSrc(c.id as IncomeSource)
                        : setSpendCat(c.id as SpendCategory)
                    }
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                      active
                        ? 'border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${c.bgClass} ${c.textClass}`}
                    >
                      <CategoryIcon name={c.iconName} className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`truncate text-[11px] font-semibold ${
                        active ? 'text-indigo-900' : 'text-slate-700'
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note + date */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="note" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Note
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isIncome ? 'e.g. Monthly allowance' : 'e.g. Auto + tea'}
                className="field"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <label
                  htmlFor="date"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                >
                  Date
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDate(today);
                      setDateTouched(false);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                      date === today
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDate(shiftISODate(today, -1));
                      setDateTouched(true);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                      date === shiftISODate(today, -1)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                id="date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDateTouched(true);
                }}
                className="field num"
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Mode
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`rounded-md py-1.5 text-[11px] font-semibold transition ${
                      paymentMode === m.id
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white shadow-sm transition active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-40 ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {amountRaw ? <CornerDownLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {disabled
              ? isIncome
                ? 'Enter amount to credit'
                : 'Enter amount to record'
              : `${isIncome ? 'Add Credit' : 'Record Spend'} · ${formatINR(
                  evaluated.value ?? 0
                )}`}
          </button>

          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              <Check className="h-3.5 w-3.5" />
              {saved}
            </div>
          )}
        </form>
      </section>
    );
  }
);
EntryPanel.displayName = 'EntryPanel';

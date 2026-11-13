import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { INCOME_SOURCES, PAYMENT_MODES, SPEND_CATEGORIES } from '../constants';
import { NewTransactionInput } from '../hooks/useSpendsStore';
import { IncomeSource, PaymentMode, SpendCategory, Transaction, TransactionType } from '../types';
import { evaluateAmountExpression, formatINR } from '../utils/mathAndFormat';

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: (id: string, updates: Partial<NewTransactionInput>) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amountRaw, setAmountRaw] = useState(String(transaction.amount));
  const [category, setCategory] = useState<SpendCategory | IncomeSource>(transaction.category);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(transaction.paymentMode);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note);

  const evalResult = evaluateAmountExpression(amountRaw);

  const handleSwitchType = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'income' && !INCOME_SOURCES.some((s) => s.id === category)) {
      setCategory('home');
    } else if (nextType === 'spend' && !SPEND_CATEGORIES.some((c) => c.id === category)) {
      setCategory('food');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalResult.valid || evalResult.value === null) return;
    onSave(transaction.id, {
      type,
      amount: evalResult.value,
      category,
      paymentMode,
      date,
      note,
    });
    onClose();
  };

  const categoryOptions = type === 'income' ? INCOME_SOURCES : SPEND_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Entry Edit Karein</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchType('spend')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'spend' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Spend (-)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchType('income')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Ghar Se Paisa (+)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold tabular-nums text-slate-900 focus:outline-none focus:border-slate-400"
            />
            {evalResult.isExpression && evalResult.valid && evalResult.value !== null && (
              <p className="mt-1 text-xs font-semibold text-indigo-600 tabular-nums">
                = {formatINR(evalResult.value)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'income' ? 'Source' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpendCategory | IncomeSource)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              {PAYMENT_MODES.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMode(pm.id)}
                  className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    paymentMode === pm.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!evalResult.valid || evalResult.value === null}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

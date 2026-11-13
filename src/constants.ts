import { CategoryMeta, IncomeSource, PaymentMode, SpendCategory, Transaction } from './types';

export const SPEND_CATEGORIES: CategoryMeta[] = [
  {
    id: 'food',
    label: 'Food & Chai',
    sublabel: 'Mess, Tiffin, Chai, Snacks',
    color: '#f97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    ringClass: 'ring-orange-200',
    iconName: 'Utensils',
  },
  {
    id: 'travel',
    label: 'Travel & Auto',
    sublabel: 'Auto, Bus, Metro, Train',
    color: '#3b82f6',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    ringClass: 'ring-blue-200',
    iconName: 'Bus',
  },
  {
    id: 'rent',
    label: 'Rent & PG/Mess',
    sublabel: 'Room Rent, Bijli, Mess Bill',
    color: '#8b5cf6',
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-700',
    ringClass: 'ring-violet-200',
    iconName: 'Home',
  },
  {
    id: 'groceries',
    label: 'Groceries & Daily',
    sublabel: 'Milk, Fruits, Maggi, Soap',
    color: '#10b981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    ringClass: 'ring-emerald-200',
    iconName: 'ShoppingBag',
  },
  {
    id: 'study',
    label: 'Study & Xerox',
    sublabel: 'Books, Notes, Forms, Pen',
    color: '#06b6d4',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    ringClass: 'ring-cyan-200',
    iconName: 'BookOpen',
  },
  {
    id: 'recharge',
    label: 'Recharge & Bills',
    sublabel: 'Mobile Data, WiFi, OTT',
    color: '#ec4899',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
    ringClass: 'ring-pink-200',
    iconName: 'Smartphone',
  },
  {
    id: 'shopping',
    label: 'Personal & Medical',
    sublabel: 'Clothes, Medicine, Haircut',
    color: '#f59e0b',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    ringClass: 'ring-amber-200',
    iconName: 'Shirt',
  },
  {
    id: 'savings',
    label: 'Savings & Investments',
    sublabel: 'Money set aside, SIP, FD, emergency fund',
    color: '#14b8a6',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    ringClass: 'ring-teal-200',
    iconName: 'PiggyBank',
  },
  {
    id: 'other',
    label: 'Other Spend',
    sublabel: 'Miscellaneous',
    color: '#64748b',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    ringClass: 'ring-slate-200',
    iconName: 'MoreHorizontal',
  },
];

export const INCOME_SOURCES: CategoryMeta[] = [
  {
    id: 'home',
    label: 'Money In',
    sublabel: 'Home / family allowance',
    color: '#059669',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    ringClass: 'ring-emerald-200',
    iconName: 'HeartHandshake',
  },
  {
    id: 'family_gift',
    label: 'Gift / Relatives',
    sublabel: 'Festival gift / relatives',
    color: '#0d9488',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    ringClass: 'ring-teal-200',
    iconName: 'Gift',
  },
  {
    id: 'stipend',
    label: 'Stipend / Earnings',
    sublabel: 'Scholarship, freelance, work',
    color: '#2563eb',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    ringClass: 'ring-blue-200',
    iconName: 'Briefcase',
  },
  {
    id: 'refund',
    label: 'Refund',
    sublabel: 'Refund / cashback',
    color: '#7c3aed',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    ringClass: 'ring-purple-200',
    iconName: 'RotateCcw',
  },
  {
    id: 'carryover',
    label: 'Opening Balance',
    sublabel: 'Carried over savings',
    color: '#475569',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    ringClass: 'ring-slate-200',
    iconName: 'Wallet',
  },
];

export const ALL_CATEGORY_MAP: Record<string, CategoryMeta> = [...SPEND_CATEGORIES, ...INCOME_SOURCES].reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, CategoryMeta>
);

export const PAYMENT_MODES: { id: PaymentMode; label: string }[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank Transfer' },
];

export const SPEND_QUICK_AMOUNTS = [20, 50, 100, 200, 500];
export const INCOME_QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export function createSampleTransactions(referenceDate: Date = new Date()): Transaction[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed
  const todayDay = referenceDate.getDate();

  const fmtDate = (y: number, m: number, d: number) => {
    const dt = new Date(y, m, d);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  const clampDay = (d: number) => Math.max(1, Math.min(todayDay, d));
  const now = Date.now();

  const items: Array<{
    type: 'income' | 'spend';
    amount: number;
    category: SpendCategory | IncomeSource;
    paymentMode: PaymentMode;
    date: string;
    note: string;
  }> = [
    {
      type: 'income',
      amount: 1200,
      category: 'carryover',
      paymentMode: 'upi',
      date: fmtDate(year, month - 1, 28),
      note: 'Carried over from last month',
    },
    {
      type: 'income',
      amount: 8000,
      category: 'home',
      paymentMode: 'bank',
      date: fmtDate(year, month, 1),
      note: 'Monthly allowance from home',
    },
    {
      type: 'spend',
      amount: 3200,
      category: 'rent',
      paymentMode: 'upi',
      date: fmtDate(year, month, clampDay(2)),
      note: 'PG Room Rent share + bijli',
    },
    {
      type: 'spend',
      amount: 349,
      category: 'recharge',
      paymentMode: 'upi',
      date: fmtDate(year, month, clampDay(3)),
      note: 'Jio 5G monthly recharge',
    },
    {
      type: 'spend',
      amount: 180,
      category: 'study',
      paymentMode: 'cash',
      date: fmtDate(year, month, clampDay(5)),
      note: 'Notes photocopy + spiral binding',
    },
    {
      type: 'spend',
      amount: 245,
      category: 'groceries',
      paymentMode: 'upi',
      date: fmtDate(year, month, clampDay(7)),
      note: 'Doodh, bread, peanut butter & Maggi',
    },
    {
      type: 'income',
      amount: 1500,
      category: 'home',
      paymentMode: 'upi',
      date: fmtDate(year, month, clampDay(9)),
      note: 'Mummy sent extra for winter hoodie',
    },
    {
      type: 'spend',
      amount: 799,
      category: 'shopping',
      paymentMode: 'upi',
      date: fmtDate(year, month, clampDay(10)),
      note: 'Warm fleece hoodie',
    },
    {
      type: 'spend',
      amount: 95,
      category: 'travel',
      paymentMode: 'cash',
      date: fmtDate(year, month, clampDay(Math.max(1, todayDay - 1))),
      note: 'Shared auto aana-jaana',
    },
    {
      type: 'spend',
      amount: 140,
      category: 'food',
      paymentMode: 'upi',
      date: fmtDate(year, month, todayDay),
      note: 'Evening thali + kulhad chai',
    },
  ];

  return items.map((item, idx) => ({
    ...item,
    id: `demo-${now}-${idx}`,
    createdAt: now - (items.length - idx) * 60_000,
  }));
}

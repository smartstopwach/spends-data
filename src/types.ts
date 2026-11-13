export type TransactionType = 'income' | 'spend';

export type SpendCategory =
  | 'food'
  | 'travel'
  | 'rent'
  | 'study'
  | 'recharge'
  | 'groceries'
  | 'shopping'
  | 'other';

export type IncomeSource =
  | 'home'
  | 'family_gift'
  | 'stipend'
  | 'refund'
  | 'carryover';

export type PaymentMode = 'upi' | 'cash' | 'bank';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: SpendCategory | IncomeSource;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: number;
}

export type MonthlyBudgets = Record<string, number>;

export interface CategoryMeta {
  id: SpendCategory | IncomeSource;
  label: string;
  sublabel: string;
  color: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
  iconName: string;
}

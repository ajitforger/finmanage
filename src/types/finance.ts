export type ViewId =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'bills'
  | 'insights'
  | 'settings';

export type AccountType = 'bank' | 'upi' | 'card' | 'investment';

export type PaymentMethod = 'UPI' | 'Debit Card' | 'Credit Card' | 'NetBanking' | 'Auto-Pay' | 'Cash';

export type TransactionType = 'expense' | 'income';

export type BudgetBucket = 'needs' | 'wants' | 'savings';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  balance: number; // Positive for assets, negative or positive owed for credit cards (tracked as asset balance or card due)
  creditLimit?: number;
  lastFour: string;
  includeInSafeToSpend: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  bucket: BudgetBucket;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  priority: 'Essential' | 'Lifestyle' | 'Wealth';
}

export interface Bill {
  id: string;
  name: string;
  provider: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  frequency: 'Monthly' | 'Quarterly' | 'Annual';
  category: string;
  accountId: string;
  autoPay: boolean;
  isPaidThisCycle: boolean;
}

export interface UserSettings {
  userName: string;
  personaLabel: string;
  currencyDisplay: 'full' | 'compact';
  monthlySavingsReserve: number;
  includeCreditCardsInSafeToSpend: boolean;
  theme: 'light' | 'dark';
}

export interface CategoryMeta {
  name: string;
  bucket: BudgetBucket;
}

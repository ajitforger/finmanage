import { Account, Bill, Budget, Transaction, UserSettings } from '../types/finance';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPreciseFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, showDecimals = false): string {
  const abs = Math.abs(amount);
  const formatted = showDecimals ? inrPreciseFormatter.format(abs) : inrFormatter.format(abs);
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}${inrFormatter.format(abs)}`;
}

export function formatDisplayINR(amount: number, mode: 'full' | 'compact' = 'full'): string {
  if (mode === 'compact' && Math.abs(amount) >= 100000) {
    return formatINRCompact(amount);
  }
  return formatINR(amount);
}

export function formatDateIN(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDateIN(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 2, 1);
  return getMonthKey(date);
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatShortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

export function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function getDaysRemainingInMonth(today: Date = new Date()): number {
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  return Math.max(1, totalDays - currentDay + 1);
}

export interface FinancialSnapshot {
  totalBalance: number;
  liquidBalance: number;
  monthlyIncome: number;
  prevMonthlyIncome: number;
  incomeDeltaPct: number;
  monthlyExpenses: number;
  prevMonthlyExpenses: number;
  expenseDeltaPct: number;
  netSavings: number;
  prevNetSavings: number;
  savingsRate: number;
  prevSavingsRate: number;
  upcomingBillsTotal: number;
  remainingPlannedSavings: number;
  safeToSpendTotal: number;
  dailySafeToSpend: number;
  daysRemaining: number;
  totalBudgetLimit: number;
  budgetUtilizationPct: number;
}

export function calculateSnapshot(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  bills: Bill[],
  settings: UserSettings,
  currentMonthKey: string,
  today: Date = new Date()
): FinancialSnapshot {
  const prevMonthKey = getPrevMonthKey(currentMonthKey);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const liquidBalance = accounts.reduce((sum, acc) => {
    if (!acc.includeInSafeToSpend) return sum;
    if (acc.type === 'card' && !settings.includeCreditCardsInSafeToSpend) return sum;
    return sum + acc.balance;
  }, 0);

  const currentTx = transactions.filter((t) => t.date.startsWith(currentMonthKey));
  const prevTx = transactions.filter((t) => t.date.startsWith(prevMonthKey));

  const monthlyIncome = currentTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthlyIncome = prevTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthlyExpenses = prevTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeDeltaPct =
    prevMonthlyIncome > 0
      ? ((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100
      : 0;

  const expenseDeltaPct =
    prevMonthlyExpenses > 0
      ? ((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100
      : 0;

  const netSavings = monthlyIncome - monthlyExpenses;
  const prevNetSavings = prevMonthlyIncome - prevMonthlyExpenses;

  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
  const prevSavingsRate =
    prevMonthlyIncome > 0 ? (prevNetSavings / prevMonthlyIncome) * 100 : 0;

  const upcomingBillsTotal = bills
    .filter((b) => !b.isPaidThisCycle)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

  // Remaining planned savings reserve for the month
  const remainingPlannedSavings = Math.max(0, settings.monthlySavingsReserve);

  // Safe-to-spend balances liquid funds against upcoming unpaid bills and planned savings reserve,
  // capped sensibly by remaining monthly budget headroom when budgets are active.
  const liquidAfterCommitments = liquidBalance - upcomingBillsTotal - remainingPlannedSavings;
  const budgetRemaining = Math.max(0, totalBudgetLimit - monthlyExpenses);

  // Use the more conservative realistic monthly runway if monthly income & budgets are set,
  // while ensuring we never exceed actual liquid funds after bills/reserves.
  const safeToSpendTotal =
    totalBudgetLimit > 0
      ? Math.min(liquidAfterCommitments, budgetRemaining)
      : liquidAfterCommitments;

  const daysRemaining = getDaysRemainingInMonth(today);
  const dailySafeToSpend = safeToSpendTotal / daysRemaining;

  const budgetUtilizationPct =
    totalBudgetLimit > 0 ? (monthlyExpenses / totalBudgetLimit) * 100 : 0;

  return {
    totalBalance,
    liquidBalance,
    monthlyIncome,
    prevMonthlyIncome,
    incomeDeltaPct,
    monthlyExpenses,
    prevMonthlyExpenses,
    expenseDeltaPct,
    netSavings,
    prevNetSavings,
    savingsRate,
    prevSavingsRate,
    upcomingBillsTotal,
    remainingPlannedSavings,
    safeToSpendTotal,
    dailySafeToSpend,
    daysRemaining,
    totalBudgetLimit,
    budgetUtilizationPct,
  };
}

export function exportTransactionsToCSV(transactions: Transaction[], accounts: Account[]) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const headers = ['Date', 'Title', 'Merchant', 'Type', 'Category', 'Account', 'Payment Method', 'Amount (INR)', 'Note'];
  const rows = transactions.map((t) => [
    t.date,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
    t.type,
    `"${t.category}"`,
    `"${accountMap.get(t.accountId) || 'Unknown'}"`,
    `"${t.paymentMethod}"`,
    t.type === 'expense' ? `-${t.amount}` : `${t.amount}`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `paisaflow-transactions-${getMonthKey()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

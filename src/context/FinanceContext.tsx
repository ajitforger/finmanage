import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Account,
  Bill,
  Budget,
  SavingsGoal,
  Transaction,
  UserSettings,
  ViewId,
} from '../types/finance';
import {
  createInitialBills,
  createInitialTransactions,
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_SETTINGS,
} from '../data/seedData';
import { calculateSnapshot, FinancialSnapshot, getMonthKey } from '../utils/formatters';

const STORAGE_KEY = 'paisaflow_state_v1';

interface PersistedState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  bills: Bill[];
  settings: UserSettings;
}

interface FinanceContextValue {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  bills: Bill[];
  settings: UserSettings;
  currentMonthKey: string;
  snapshot: FinancialSnapshot;
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openAddTransaction: () => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTransactionModal: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateBudgetLimit: (id: string, newLimit: number) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  contributeToGoal: (goalId: string, amount: number, accountId?: string) => void;
  deleteGoal: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  markBillPaid: (billId: string) => void;
  toggleBillAutoPay: (billId: string) => void;
  deleteBill: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  resetDemoData: () => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.accounts) &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.budgets) &&
        Array.isArray(parsed.goals) &&
        Array.isArray(parsed.bills) &&
        parsed.settings
      ) {
        return {
          accounts: parsed.accounts,
          transactions: parsed.transactions,
          budgets: parsed.budgets,
          goals: parsed.goals,
          bills: parsed.bills,
          settings: { ...INITIAL_SETTINGS, ...parsed.settings },
        };
      }
    }
  } catch {
    // Fallback to clean seed data if storage is unreadable
  }

  return {
    accounts: INITIAL_ACCOUNTS,
    transactions: createInitialTransactions(),
    budgets: INITIAL_BUDGETS,
    goals: INITIAL_GOALS,
    bills: createInitialBills(),
    settings: INITIAL_SETTINGS,
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [activeView, setActiveView] = useState<ViewId>('overview');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  // Global keyboard shortcut 'n' to open quick-add transaction
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping) return;
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
      }
      if (e.key === 'Escape' && isTransactionModalOpen) {
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTransactionModalOpen]);

  const snapshot = useMemo(
    () =>
      calculateSnapshot(
        state.accounts,
        state.transactions,
        state.budgets,
        state.bills,
        state.settings,
        currentMonthKey,
        new Date()
      ),
    [state.accounts, state.transactions, state.budgets, state.bills, state.settings, currentMonthKey]
  );

  const openAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const addTransaction = (txInput: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTx: Transaction = { ...txInput, id };

    setState((prev) => {
      const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
      const updatedAccounts = prev.accounts.map((acc) =>
        acc.id === newTx.accountId ? { ...acc, balance: acc.balance + delta } : acc
      );
      const updatedTransactions = [newTx, ...prev.transactions].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      return { ...prev, accounts: updatedAccounts, transactions: updatedTransactions };
    });
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setState((prev) => {
      const oldTx = prev.transactions.find((t) => t.id === updatedTx.id);
      let updatedAccounts = [...prev.accounts];

      if (oldTx) {
        const oldDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        updatedAccounts = updatedAccounts.map((acc) =>
          acc.id === oldTx.accountId ? { ...acc, balance: acc.balance + oldDelta } : acc
        );
      }

      const newDelta = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;
      updatedAccounts = updatedAccounts.map((acc) =>
        acc.id === updatedTx.accountId ? { ...acc, balance: acc.balance + newDelta } : acc
      );

      const updatedTransactions = prev.transactions
        .map((t) => (t.id === updatedTx.id ? updatedTx : t))
        .sort((a, b) => b.date.localeCompare(a.date));

      return { ...prev, accounts: updatedAccounts, transactions: updatedTransactions };
    });
  };

  const deleteTransaction = (id: string) => {
    setState((prev) => {
      const target = prev.transactions.find((t) => t.id === id);
      let updatedAccounts = prev.accounts;
      if (target) {
        const reversal = target.type === 'income' ? -target.amount : target.amount;
        updatedAccounts = prev.accounts.map((acc) =>
          acc.id === target.accountId ? { ...acc, balance: acc.balance + reversal } : acc
        );
      }
      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter((t) => t.id !== id),
      };
    });
  };

  const updateBudgetLimit = (id: string, newLimit: number) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === id ? { ...b, limit: Math.max(0, newLimit) } : b)),
    }));
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const id = `bud-${Date.now()}`;
    setState((prev) => ({ ...prev, budgets: [...prev.budgets, { ...budget, id }] }));
  };

  const deleteBudget = (id: string) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  };

  const addGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const id = `goal-${Date.now()}`;
    setState((prev) => ({ ...prev, goals: [...prev.goals, { ...goal, id }] }));
  };

  const contributeToGoal = (goalId: string, amount: number, accountId?: string) => {
    if (amount <= 0) return;
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      const updatedGoals = prev.goals.map((g) =>
        g.id === goalId
          ? { ...g, savedAmount: Math.min(g.targetAmount * 2, g.savedAmount + amount) }
          : g
      );

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (accountId && goal) {
        updatedAccounts = prev.accounts.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance - amount } : acc
        );
        const todayStr = new Date().toISOString().slice(0, 10);
        const newTx: Transaction = {
          id: `tx-goal-${Date.now()}`,
          title: `Goal Contribution: ${goal.name}`,
          merchant: 'PaisaFlow Savings Vault',
          amount,
          type: 'expense',
          category: 'Investments & SIP',
          accountId,
          paymentMethod: 'NetBanking',
          date: todayStr,
          note: 'Allocated to savings goal',
        };
        updatedTransactions = [newTx, ...prev.transactions];
      }

      return {
        ...prev,
        goals: updatedGoals,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const deleteGoal = (id: string) => {
    setState((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
  };

  const addBill = (bill: Omit<Bill, 'id'>) => {
    const id = `bill-${Date.now()}`;
    setState((prev) => ({ ...prev, bills: [...prev.bills, { ...bill, id }] }));
  };

  const markBillPaid = (billId: string) => {
    setState((prev) => {
      const bill = prev.bills.find((b) => b.id === billId);
      if (!bill || bill.isPaidThisCycle) return prev;

      const todayStr = new Date().toISOString().slice(0, 10);
      const tx: Transaction = {
        id: `tx-bill-${Date.now()}`,
        title: bill.name,
        merchant: bill.provider,
        amount: bill.amount,
        type: 'expense',
        category: bill.category,
        accountId: bill.accountId,
        paymentMethod: bill.autoPay ? 'Auto-Pay' : 'UPI',
        date: todayStr,
        note: 'Paid from Bills & Subscriptions',
      };

      const updatedAccounts = prev.accounts.map((acc) =>
        acc.id === bill.accountId ? { ...acc, balance: acc.balance - bill.amount } : acc
      );

      const updatedBills = prev.bills.map((b) =>
        b.id === billId ? { ...b, isPaidThisCycle: true } : b
      );

      return {
        ...prev,
        accounts: updatedAccounts,
        bills: updatedBills,
        transactions: [tx, ...prev.transactions],
      };
    });
  };

  const toggleBillAutoPay = (billId: string) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === billId ? { ...b, autoPay: !b.autoPay } : b)),
    }));
  };

  const deleteBill = (id: string) => {
    setState((prev) => ({ ...prev, bills: prev.bills.filter((b) => b.id !== id) }));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}`;
    setState((prev) => ({ ...prev, accounts: [...prev.accounts, { ...account, id }] }));
  };

  const updateAccount = (account: Account) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  };

  const deleteAccount = (id: string) => {
    setState((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }));
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  };

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const resetDemoData = () => {
    setState((prev) => ({
      accounts: INITIAL_ACCOUNTS,
      transactions: createInitialTransactions(),
      budgets: INITIAL_BUDGETS,
      goals: INITIAL_GOALS,
      bills: createInitialBills(),
      settings: { ...INITIAL_SETTINGS, theme: prev.settings.theme },
    }));
  };

  const clearAllData = () => {
    setState((prev) => ({
      accounts: [
        {
          id: 'acc-primary',
          name: 'Primary Bank Account',
          institution: 'HDFC Bank',
          type: 'bank',
          balance: 0,
          lastFour: '0001',
          includeInSafeToSpend: true,
        },
      ],
      transactions: [],
      budgets: [],
      goals: [],
      bills: [],
      settings: { ...prev.settings, monthlySavingsReserve: 0 },
    }));
  };

  return (
    <FinanceContext.Provider
      value={{
        activeView,
        setActiveView,
        accounts: state.accounts,
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        bills: state.bills,
        settings: state.settings,
        currentMonthKey,
        snapshot,
        isTransactionModalOpen,
        editingTransaction,
        openAddTransaction,
        openEditTransaction,
        closeTransactionModal,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetLimit,
        addBudget,
        deleteBudget,
        addGoal,
        contributeToGoal,
        deleteGoal,
        addBill,
        markBillPaid,
        toggleBillAutoPay,
        deleteBill,
        addAccount,
        updateAccount,
        deleteAccount,
        updateSettings,
        toggleTheme,
        resetDemoData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}

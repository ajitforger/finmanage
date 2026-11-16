import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import { PaymentMethod, TransactionType } from '../types/finance';
import { formatINR } from '../utils/formatters';

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'NetBanking',
  'Auto-Pay',
  'Cash',
];

const QUICK_AMOUNTS = [250, 500, 1200, 2500, 5000];

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    addTransaction,
    updateTransaction,
    accounts,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTransactionModalOpen) return;
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setMerchant(editingTransaction.merchant);
      setAmountStr(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
      setError('');
    } else {
      setType('expense');
      setTitle('');
      setMerchant('');
      setAmountStr('');
      setCategory('Dining & Delivery');
      setAccountId(accounts.find((a) => a.type === 'upi')?.id || accounts[0]?.id || '');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setError('');
    }
  }, [isTransactionModalOpen, editingTransaction, accounts]);

  if (!isTransactionModalOpen) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextCats.includes(category)) {
      setCategory(nextCats[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr);
    if (!numericAmount || numericAmount <= 0 || Number.isNaN(numericAmount)) {
      setError('Enter a valid INR amount greater than zero.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a short description for this entry.');
      return;
    }
    if (!accountId) {
      setError('Select an account.');
      return;
    }

    const payload = {
      title: title.trim(),
      merchant: merchant.trim() || title.trim(),
      amount: Math.round(numericAmount),
      type,
      category,
      accountId,
      paymentMethod,
      date,
      note: note.trim() || undefined,
    };

    if (editingTransaction) {
      updateTransaction({ ...payload, id: editingTransaction.id });
    } else {
      addTransaction(payload);
    }
    closeTransactionModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0E172A]/50 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] shadow-xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2D8] dark:border-[#232B3A]">
          <div>
            <h2
              id="tx-modal-title"
              className="text-lg font-bold tracking-tight text-[#0E172A] dark:text-[#F4F3EE]"
            >
              {editingTransaction ? 'Edit transaction' : 'Log transaction'}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Updates your account balance, budgets, and daily Safe-to-Spend
            </p>
          </div>
          <button
            type="button"
            onClick={closeTransactionModal}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Type Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                type === 'expense'
                  ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE] shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                type === 'income'
                  ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#4D7C0F] dark:text-[#A3E635] shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label
              htmlFor="tx-amount"
              className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5"
            >
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#64748B] dark:text-[#94A3B8]">
                ₹
              </span>
              <input
                id="tx-amount"
                type="number"
                min="1"
                step="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full pl-8 pr-4 py-2.5 text-xl font-bold font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              />
            </div>
            {!editingTransaction && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountStr(String(amt))}
                    className="px-2.5 py-1 text-xs font-mono-nums font-medium rounded-md border border-[#E5E2D8] dark:border-[#232B3A] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors"
                  >
                    +{formatINR(amt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-title"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Description
              </label>
              <input
                id="tx-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'expense' ? 'e.g. Zepto Groceries' : 'e.g. Client Invoice'}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              />
            </div>
            <div>
              <label
                htmlFor="tx-merchant"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Merchant / Payee
              </label>
              <input
                id="tx-merchant"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Blue Tokai"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Category
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              />
            </div>
          </div>

          {/* Account & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-account"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Account
              </label>
              <select
                id="tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatINR(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tx-method"
                className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
              >
                Payment mode
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1"
            >
              Note (optional)
            </label>
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="UPI ref or personal reminder"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-[#DC4C3E] dark:text-[#F07160]" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E2D8] dark:border-[#232B3A]">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-sm font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#84CC16] hover:bg-[#65A30D] dark:bg-[#A3E635] dark:hover:bg-[#BEF264] text-[#0E172A] transition-colors cursor-pointer"
            >
              {editingTransaction ? 'Save changes' : 'Save transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

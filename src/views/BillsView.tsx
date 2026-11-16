import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES } from '../data/seedData';
import { Bill } from '../types/finance';
import { formatDateIN, formatINR } from '../utils/formatters';

export function BillsView() {
  const { bills, accounts, addBill, markBillPaid, toggleBillAutoPay, deleteBill } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('999');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Utilities & Bills');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [frequency, setFrequency] = useState<Bill['frequency']>('Monthly');
  const [autoPay, setAutoPay] = useState(true);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const summary = useMemo(() => {
    const unpaid = bills.filter((b) => !b.isPaidThisCycle);
    const paid = bills.filter((b) => b.isPaidThisCycle);
    const unpaidTotal = unpaid.reduce((s, b) => s + b.amount, 0);
    const paidTotal = paid.reduce((s, b) => s + b.amount, 0);
    const monthlyEquivalent = bills.reduce((s, b) => {
      if (b.frequency === 'Annual') return s + b.amount / 12;
      if (b.frequency === 'Quarterly') return s + b.amount / 3;
      return s + b.amount;
    }, 0);
    return {
      unpaid,
      paid,
      unpaidTotal,
      paidTotal,
      monthlyEquivalent: Math.round(monthlyEquivalent),
      annualRunRate: Math.round(monthlyEquivalent * 12),
    };
  }, [bills]);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!name.trim() || Number.isNaN(num) || num <= 0) return;
    addBill({
      name: name.trim(),
      provider: provider.trim() || name.trim(),
      amount: Math.round(num),
      dueDate,
      frequency,
      category,
      accountId,
      autoPay,
      isPaidThisCycle: false,
    });
    setName('');
    setProvider('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Bills KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
            Remaining due this cycle
          </p>
          <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            {formatINR(summary.unpaidTotal)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {summary.unpaid.length} pending commitments
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
            Paid this cycle
          </p>
          <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#4D7C0F] dark:text-[#A3E635]">
            {formatINR(summary.paidTotal)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {summary.paid.length} settled on time
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              Recurring annual run-rate
            </p>
            <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
              {formatINR(summary.annualRunRate)}
            </p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
              {formatINR(summary.monthlyEquivalent)} / month avg
            </p>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
          Scheduled bills &amp; subscriptions
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#84CC16] hover:bg-[#65A30D] dark:bg-[#A3E635] dark:hover:bg-[#BEF264] text-[#0E172A] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add bill / subscription</span>
        </button>
      </div>

      {/* Add Bill Form */}
      {showAdd && (
        <form
          onSubmit={handleAddBill}
          className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
              New recurring bill
            </h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="p-1 text-[#64748B]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Bill or subscription
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JioFiber, Netflix"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Provider
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Reliance Jio"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Amount (INR)
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Next due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Pay from account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 text-xs">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Bill['frequency'])}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPay}
                  onChange={(e) => setAutoPay(e.target.checked)}
                  className="accent-[#65A30D]"
                />
                <span className="text-[#475569] dark:text-[#CBD5E1]">Auto-pay mandate</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
            >
              Save bill
            </button>
          </div>
        </form>
      )}

      {/* Bills List */}
      <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
        {bills.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            No recurring bills added yet.
          </div>
        ) : (
          [...bills]
            .sort((a, b) => Number(a.isPaidThisCycle) - Number(b.isPaidThisCycle))
            .map((b) => {
              const acc = accountMap.get(b.accountId);
              return (
                <div
                  key={b.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE] truncate">
                        {b.name}
                      </p>
                      {b.isPaidThisCycle && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                      {b.provider} · {b.frequency} · Due {formatDateIN(b.dueDate)} ·{' '}
                      {acc?.name || 'Account'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBillAutoPay(b.id)}
                      className="text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] underline decoration-dotted cursor-pointer"
                    >
                      {b.autoPay ? 'Auto-pay: On' : 'Auto-pay: Off'}
                    </button>

                    <span className="font-mono-nums text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                      {formatINR(b.amount)}
                    </span>

                    {!b.isPaidThisCycle && (
                      <button
                        type="button"
                        onClick={() => markBillPaid(b.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#84CC16] hover:bg-[#65A30D] dark:bg-[#A3E635] dark:hover:bg-[#BEF264] text-[#0E172A] transition-colors cursor-pointer"
                      >
                        Mark paid
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteBill(b.id)}
                      className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC4C3E] dark:hover:text-[#F07160] cursor-pointer"
                      aria-label={`Delete ${b.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

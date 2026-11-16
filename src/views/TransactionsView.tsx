import React, { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import { exportTransactionsToCSV, formatDateIN, formatINR } from '../utils/formatters';

export function TransactionsView() {
  const {
    transactions,
    accounts,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
  } = useFinance();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const allCategories = useMemo(
    () => Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
        if (q) {
          const hay = `${t.title} ${t.merchant} ${t.category} ${t.note || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return b.date.localeCompare(a.date);
      });
  }, [transactions, query, typeFilter, categoryFilter, accountFilter, sortBy]);

  const totals = useMemo(() => {
    const inflow = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const outflow = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search merchant, description, or note..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] focus:outline-none focus:ring-2 focus:ring-[#65A30D] dark:focus:ring-[#A3E635]"
            />
          </div>

          {/* Segmented Type Filter + CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]">
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE] shadow-xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => exportTransactionsToCSV(filtered, accounts)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Secondary filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-xs rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE]"
          >
            <option value="all">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            aria-label="Filter by account"
            className="px-3 py-2 text-xs rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE]"
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort transactions"
            className="px-3 py-2 text-xs rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE]"
          >
            <option value="date-desc">Newest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-xs">
        <span className="text-[#64748B] dark:text-[#94A3B8]">
          Showing <strong className="text-[#0E172A] dark:text-[#F4F3EE]">{filtered.length}</strong>{' '}
          transactions
        </span>
        <div className="flex flex-wrap items-center gap-4 font-mono-nums">
          <span className="text-[#4D7C0F] dark:text-[#A3E635]">
            Inflow +{formatINR(totals.inflow)}
          </span>
          <span className="text-[#475569] dark:text-[#CBD5E1]">
            Outflow -{formatINR(totals.outflow)}
          </span>
          <span className="font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
            Net {formatINR(totals.net)}
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
              No matching transactions
            </p>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
              Adjust your search or filters, or log a new expense or income entry.
            </p>
            <button
              type="button"
              onClick={openAddTransaction}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log first transaction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E2D8] dark:border-[#232B3A] text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-4 hidden md:table-cell">Account &amp; Mode</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A] text-sm">
                {filtered.map((tx) => {
                  const acc = accountMap.get(tx.accountId);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#FAF9F5] dark:hover:bg-[#162032] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#0E172A] dark:text-[#F4F3EE]">{tx.title}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {tx.merchant}
                          {tx.note ? ` · ${tx.note}` : ''}
                        </p>
                        <p className="sm:hidden text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {tx.category} · {formatDateIN(tx.date)}
                        </p>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-xs text-[#475569] dark:text-[#CBD5E1]">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {acc?.name || 'Account'} · {tx.paymentMethod}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-xs font-mono-nums text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                        {formatDateIN(tx.date)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-nums font-semibold whitespace-nowrap ${
                          tx.type === 'income'
                            ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                            : 'text-[#0E172A] dark:text-[#F4F3EE]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTransaction(tx)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                            aria-label={`Edit ${tx.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC4C3E] dark:hover:text-[#F07160] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                            aria-label={`Delete ${tx.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

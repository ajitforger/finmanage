import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES } from '../data/seedData';
import { BudgetBucket } from '../types/finance';
import { formatINR } from '../utils/formatters';

export function BudgetsView() {
  const {
    budgets,
    transactions,
    currentMonthKey,
    updateBudgetLimit,
    addBudget,
    deleteBudget,
  } = useFinance();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('5000');
  const [newBucket, setNewBucket] = useState<BudgetBucket>('wants');

  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthKey))
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });
    return map;
  }, [transactions, currentMonthKey]);

  const enrichedBudgets = useMemo(
    () =>
      budgets.map((b) => {
        const spent = categorySpendMap.get(b.category) || 0;
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        const remaining = b.limit - spent;
        return { ...b, spent, pct, remaining };
      }),
    [budgets, categorySpendMap]
  );

  const totals = useMemo(() => {
    const totalLimit = enrichedBudgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = enrichedBudgets.reduce((s, b) => s + b.spent, 0);
    const overCount = enrichedBudgets.filter((b) => b.spent > b.limit).length;
    return {
      totalLimit,
      totalSpent,
      remaining: totalLimit - totalSpent,
      pct: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      overCount,
    };
  }, [enrichedBudgets]);

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !budgets.some((b) => b.category === c)
  );

  const startEdit = (id: string, currentLimit: number) => {
    setEditingId(id);
    setEditValue(String(currentLimit));
  };

  const commitEdit = (id: string) => {
    const num = Number(editValue);
    if (!Number.isNaN(num) && num >= 0) {
      updateBudgetLimit(id, Math.round(num));
    }
    setEditingId(null);
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(newLimit);
    if (!newCategory || Number.isNaN(num) || num <= 0) return;
    addBudget({ category: newCategory, limit: Math.round(num), bucket: newBucket });
    setShowAddForm(false);
    setNewLimit('5000');
  };

  return (
    <div className="space-y-6">
      {/* Overall Monthly Budget Summary */}
      <section className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              Total monthly budget allocation
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
                {formatINR(totals.totalSpent)}
              </span>
              <span className="text-sm font-mono-nums text-[#64748B] dark:text-[#94A3B8]">
                of {formatINR(totals.totalLimit)} budgeted ({totals.pct.toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {availableCategories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setNewCategory(availableCategories[0]);
                  setShowAddForm((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add category budget</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 h-3 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
          <div
            style={{ width: `${Math.min(100, totals.pct)}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              totals.totalSpent > totals.totalLimit
                ? 'bg-[#E05A47] dark:bg-[#F07160]'
                : 'bg-[#65A30D] dark:bg-[#A3E635]'
            }`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <span>
            {totals.remaining >= 0
              ? `${formatINR(totals.remaining)} remaining across ${budgets.length} categories`
              : `Exceeded total monthly plan by ${formatINR(Math.abs(totals.remaining))}`}
          </span>
          {totals.overCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-[#DC4C3E] dark:text-[#F07160]">
              <AlertTriangle className="h-3.5 w-3.5" />
              {totals.overCount} {totals.overCount === 1 ? 'category' : 'categories'} over limit
            </span>
          )}
        </div>
      </section>

      {/* Add Budget Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddBudget}
          className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Monthly cap (INR)
            </label>
            <input
              type="number"
              min="500"
              step="500"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              50/30/20 group
            </label>
            <select
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value as BudgetBucket)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            >
              <option value="needs">Needs (50%)</option>
              <option value="wants">Wants (30%)</option>
              <option value="savings">Savings (20%)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-2 rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] text-[#64748B]"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Category Budgets Grid */}
      {enrichedBudgets.length === 0 ? (
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-10 text-center">
          <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
            No category budgets configured
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Add monthly spending caps to track category limits and guide Safe-to-Spend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrichedBudgets.map((b) => {
            const isOver = b.spent > b.limit;
            const isNear = !isOver && b.pct >= 80;
            const isEditing = editingId === b.id;

            return (
              <div
                key={b.id}
                className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                        {b.category}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] capitalize">
                        {b.bucket} allocation
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(b.id, b.limit)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                            aria-label={`Edit ${b.category} limit`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBudget(b.id)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC4C3E] dark:hover:text-[#F07160] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                            aria-label={`Remove ${b.category} budget`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount & Inline Edit */}
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <div className="font-mono-nums">
                      <span className="text-lg font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                        {formatINR(b.spent)}
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] ml-1.5">
                        / {formatINR(b.limit)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono-nums font-semibold ${
                        isOver
                          ? 'text-[#DC4C3E] dark:text-[#F07160]'
                          : isNear
                          ? 'text-[#D97706] dark:text-[#F59E0B]'
                          : 'text-[#4D7C0F] dark:text-[#A3E635]'
                      }`}
                    >
                      {b.pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="mt-2 h-2 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-[#E05A47] dark:bg-[#F07160]'
                          : isNear
                          ? 'bg-[#D97706] dark:bg-[#F59E0B]'
                          : 'bg-[#65A30D] dark:bg-[#A3E635]'
                      }`}
                    />
                  </div>
                </div>

                {/* Footer / Inline Editor */}
                <div className="mt-3 pt-3 border-t border-[#E5E2D8] dark:border-[#232B3A]">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748B]">New limit ₹</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(b.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-28 px-2.5 py-1 text-xs font-mono-nums rounded-md bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
                      />
                      <button
                        type="button"
                        onClick={() => commitEdit(b.id)}
                        className="p-1.5 rounded-md bg-[#84CC16] text-[#0E172A] cursor-pointer"
                        aria-label="Confirm budget limit"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-md text-[#64748B] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : isOver ? (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC4C3E] dark:text-[#F07160]">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Over budget by {formatINR(Math.abs(b.remaining))}
                    </p>
                  ) : (
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      <span className="font-mono-nums font-medium text-[#0E172A] dark:text-[#F4F3EE]">
                        {formatINR(b.remaining)}
                      </span>{' '}
                      left for this month
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

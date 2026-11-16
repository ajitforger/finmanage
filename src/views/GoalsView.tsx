import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/finance';
import { formatDateIN, formatDisplayINR, formatINR } from '../utils/formatters';

export function GoalsView() {
  const { goals, accounts, settings, addGoal, contributeToGoal, deleteGoal } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('100000');
  const [savedAmount, setSavedAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('5000');
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [priority, setPriority] = useState<SavingsGoal['priority']>('Lifestyle');

  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('5000');
  const [contribAccountId, setContribAccountId] = useState(
    accounts.find((a) => a.type === 'bank' || a.type === 'upi')?.id || accounts[0]?.id || ''
  );

  const fmt = (v: number) => formatDisplayINR(v, settings.currencyDisplay);

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const monthly = goals.reduce((s, g) => s + g.monthlyContribution, 0);
    return {
      target,
      saved,
      monthly,
      pct: target > 0 ? (saved / target) * 100 : 0,
    };
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = Number(targetAmount);
    const svd = Number(savedAmount) || 0;
    const mthly = Number(monthlyContribution) || 0;
    if (!name.trim() || Number.isNaN(tgt) || tgt <= 0) return;
    addGoal({
      name: name.trim(),
      targetAmount: Math.round(tgt),
      savedAmount: Math.round(svd),
      monthlyContribution: Math.round(mthly),
      targetDate,
      priority,
    });
    setName('');
    setShowAdd(false);
  };

  const handleContribute = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amt = Number(contribAmount);
    if (Number.isNaN(amt) || amt <= 0) return;
    contributeToGoal(goalId, Math.round(amt), contribAccountId || undefined);
    setContributingGoalId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <section className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              Total saved toward goals
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
                {fmt(totals.saved)}
              </span>
              <span className="text-sm font-mono-nums text-[#64748B] dark:text-[#94A3B8]">
                of {fmt(totals.target)} target ({totals.pct.toFixed(0)}%)
              </span>
            </div>
            <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
              Planned monthly contributions: {formatINR(totals.monthly)} / month
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#84CC16] hover:bg-[#65A30D] dark:bg-[#A3E635] dark:hover:bg-[#BEF264] text-[#0E172A] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New savings goal</span>
          </button>
        </div>
      </section>

      {/* Add Goal Form */}
      {showAdd && (
        <form
          onSubmit={handleAddGoal}
          className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
              Create savings goal
            </h2>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="p-1 text-[#64748B] hover:text-[#0E172A]"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Goal name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ladakh Bike Trip"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Target amount (INR)
              </label>
              <input
                type="number"
                min="1000"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Already saved (INR)
              </label>
              <input
                type="number"
                min="0"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Monthly plan (INR)
              </label>
              <input
                type="number"
                min="0"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Target date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SavingsGoal['priority'])}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
              >
                <option value="Essential">Essential</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Wealth">Wealth</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-[#64748B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
            >
              Create goal
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-10 text-center">
          <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
            No savings goals yet
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Set up an emergency fund, travel fund, or investment milestone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
            const remaining = Math.max(0, g.targetAmount - g.savedAmount);
            const monthsLeft =
              g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : null;
            const isComplete = g.savedAmount >= g.targetAmount;
            const isContributing = contributingGoalId === g.id;

            return (
              <div
                key={g.id}
                className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {g.priority} · Target {formatDateIN(g.targetDate)}
                      </p>
                      <h3 className="mt-1 font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                        {g.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteGoal(g.id)}
                      className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC4C3E] dark:hover:text-[#F07160] hover:bg-[#F3F1EA] dark:hover:bg-[#1E293B] cursor-pointer"
                      aria-label={`Delete ${g.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <div className="font-mono-nums">
                      <span className="text-xl font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                        {formatINR(g.savedAmount)}
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] ml-1.5">
                        / {formatINR(g.targetAmount)}
                      </span>
                    </div>
                    <span className="text-xs font-mono-nums font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2.5 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-[#65A30D] dark:bg-[#A3E635] transition-all duration-300"
                    />
                  </div>

                  <div className="mt-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#4D7C0F] dark:text-[#A3E635]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Goal achieved
                      </span>
                    ) : (
                      <span>
                        {formatINR(remaining)} to go
                        {monthsLeft !== null
                          ? ` · ~${monthsLeft} mo at ${formatINR(g.monthlyContribution)}/mo`
                          : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contribute action */}
                <div className="mt-4 pt-4 border-t border-[#E5E2D8] dark:border-[#232B3A]">
                  {isContributing ? (
                    <form
                      onSubmit={(e) => handleContribute(e, g.id)}
                      className="space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={contribAmount}
                          onChange={(e) => setContribAmount(e.target.value)}
                          placeholder="Amount ₹"
                          autoFocus
                          className="px-3 py-1.5 text-xs font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
                        />
                        <select
                          value={contribAccountId}
                          onChange={(e) => setContribAccountId(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
                        >
                          <option value="">Track only</option>
                          {accounts
                            .filter((a) => a.type !== 'card')
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                From {a.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setContributingGoalId(null)}
                          className="px-3 py-1.5 text-xs text-[#64748B]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
                        >
                          Deposit
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        Suggested: {formatINR(g.monthlyContribution)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setContribAmount(String(g.monthlyContribution || 5000));
                          setContributingGoalId(g.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors cursor-pointer"
                      >
                        + Add funds
                      </button>
                    </div>
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

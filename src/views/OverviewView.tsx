import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatDisplayINR,
  formatINR,
  formatShortDateIN,
  formatShortMonthLabel,
  getPrevMonthKey,
} from '../utils/formatters';
import { CashflowBarChart, MonthlyCashflowPoint } from '../components/Charts';

export function OverviewView() {
  const {
    accounts,
    transactions,
    budgets,
    bills,
    settings,
    currentMonthKey,
    snapshot,
    setActiveView,
    markBillPaid,
    openEditTransaction,
  } = useFinance();

  const [showFormula, setShowFormula] = useState(false);

  const fmt = (val: number) => formatDisplayINR(val, settings.currencyDisplay);

  // Build 6-month cashflow dataset
  const cashflowData: MonthlyCashflowPoint[] = useMemo(() => {
    const keys: string[] = [];
    let cursor = currentMonthKey;
    for (let i = 0; i < 6; i++) {
      keys.unshift(cursor);
      cursor = getPrevMonthKey(cursor);
    }
    return keys.map((mk) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(mk));
      const income = monthTx
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return {
        monthKey: mk,
        label: formatShortMonthLabel(mk),
        income,
        expense,
        savings: income - expense,
      };
    });
  }, [transactions, currentMonthKey]);

  // Budget category spend for current month
  const budgetSummary = useMemo(() => {
    const curExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentMonthKey)
    );
    return budgets
      .map((b) => {
        const spent = curExpenses
          .filter((t) => t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        return { ...b, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, currentMonthKey]);

  const upcomingBills = useMemo(
    () =>
      [...bills]
        .filter((b) => !b.isPaidThisCycle)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
    [bills]
  );

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [transactions]
  );

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  const isSafeNegative = snapshot.safeToSpendTotal < 0;

  return (
    <div className="space-y-6">
      {/* 1. Hero Focal Anchor: Safe-to-Spend + Accounts Overview */}
      <section
        aria-label="Safe-to-spend and accounts"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* Safe-to-Spend Primary Anchor */}
        <div className="lg:col-span-7 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Safe-to-spend this month
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span
                    className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight font-mono-nums ${
                      isSafeNegative
                        ? 'text-[#DC4C3E] dark:text-[#F07160]'
                        : 'text-[#0E172A] dark:text-[#F4F3EE]'
                    }`}
                  >
                    {formatINR(Math.round(snapshot.safeToSpendTotal))}
                  </span>
                  <span className="text-sm font-medium text-[#475569] dark:text-[#CBD5E1] font-mono-nums">
                    {isSafeNegative ? (
                      <span className="inline-flex items-center gap-1 text-[#DC4C3E] dark:text-[#F07160]">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Over committed runway
                      </span>
                    ) : (
                      <>
                        {formatINR(Math.round(snapshot.dailySafeToSpend))} / day ·{' '}
                        {snapshot.daysRemaining} days left
                      </>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFormula((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] px-2.5 py-1.5 rounded-md border border-[#E5E2D8] dark:border-[#232B3A] transition-colors cursor-pointer shrink-0"
              >
                <Info className="h-3.5 w-3.5" />
                <span>How it works</span>
                {showFormula ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Runway Allocation Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] mb-2">
                <span>Liquid funds allocation</span>
                <span className="font-mono-nums">
                  {formatINR(snapshot.liquidBalance)} available cash
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden flex">
                {snapshot.liquidBalance > 0 && (
                  <>
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (snapshot.upcomingBillsTotal / snapshot.liquidBalance) * 100
                        )}%`,
                      }}
                      className="bg-[#0E172A] dark:bg-[#64748B] transition-all duration-300"
                      title={`Upcoming bills: ${formatINR(snapshot.upcomingBillsTotal)}`}
                    />
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (snapshot.remainingPlannedSavings / snapshot.liquidBalance) * 100
                        )}%`,
                      }}
                      className="bg-[#94A3B8] dark:bg-[#334155] transition-all duration-300"
                      title={`Planned savings reserve: ${formatINR(snapshot.remainingPlannedSavings)}`}
                    />
                    <div
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (Math.max(0, snapshot.safeToSpendTotal) / snapshot.liquidBalance) * 100
                          )
                        )}%`,
                      }}
                      className="bg-[#84CC16] dark:bg-[#A3E635] transition-all duration-300"
                      title={`Safe to spend: ${formatINR(Math.max(0, snapshot.safeToSpendTotal))}`}
                    />
                  </>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] block">Unpaid bills</span>
                  <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                    {formatINR(snapshot.upcomingBillsTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] block">Savings reserve</span>
                  <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                    {formatINR(snapshot.remainingPlannedSavings)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] block">Budget headroom</span>
                  <span className="font-mono-nums font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
                    {formatINR(Math.max(0, snapshot.totalBudgetLimit - snapshot.monthlyExpenses))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {showFormula && (
            <div className="mt-4 pt-4 border-t border-[#E5E2D8] dark:border-[#232B3A] text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              PaisaFlow takes your spendable bank &amp; UPI cash (
              <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                {formatINR(snapshot.liquidBalance)}
              </span>
              ), deducts upcoming unpaid bills (
              <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                {formatINR(snapshot.upcomingBillsTotal)}
              </span>
              ) and your monthly savings target (
              <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                {formatINR(snapshot.remainingPlannedSavings)}
              </span>
              ), and caps by your remaining monthly budget headroom so your savings stay protected.
            </div>
          )}
        </div>

        {/* Linked Accounts Strip */}
        <div className="lg:col-span-5 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                Connected accounts
              </h2>
              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className="text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE] truncate">
                      {acc.name}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {acc.institution} · •••• {acc.lastFour}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold font-mono-nums ${
                        acc.balance < 0
                          ? 'text-[#DC4C3E] dark:text-[#F07160]'
                          : 'text-[#0E172A] dark:text-[#F4F3EE]'
                      }`}
                    >
                      {fmt(acc.balance)}
                    </p>
                    {acc.type === 'card' && (
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Card due</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E2D8] dark:border-[#232B3A] flex items-center justify-between text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Net balance across accounts</span>
            <span className="font-mono-nums font-bold text-[#0E172A] dark:text-[#F4F3EE]">
              {fmt(snapshot.totalBalance)}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Financial Snapshot 4-Column KPI Row */}
      <section
        aria-label="Monthly financial snapshot"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Total net worth</p>
          <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            {fmt(snapshot.totalBalance)}
          </p>
          <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {accounts.length} active accounts · Liquid {fmt(snapshot.liquidBalance)}
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Monthly income</p>
          <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            {fmt(snapshot.monthlyIncome)}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635]">
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono-nums">
              {snapshot.incomeDeltaPct >= 0 ? '+' : ''}
              {snapshot.incomeDeltaPct.toFixed(1)}%
            </span>
            <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">vs last month</span>
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Monthly expenses</p>
          <p className="mt-2 font-display text-2xl font-bold font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            {fmt(snapshot.monthlyExpenses)}
          </p>
          <p
            className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
              snapshot.expenseDeltaPct > 5
                ? 'text-[#DC4C3E] dark:text-[#F07160]'
                : 'text-[#4D7C0F] dark:text-[#A3E635]'
            }`}
          >
            {snapshot.expenseDeltaPct >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="font-mono-nums">
              {snapshot.expenseDeltaPct >= 0 ? '+' : ''}
              {snapshot.expenseDeltaPct.toFixed(1)}%
            </span>
            <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">vs last month</span>
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-5">
          <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
            Net savings &amp; rate
          </p>
          <div className="mt-2 flex items-baseline gap-2.5">
            <p
              className={`font-display text-2xl font-bold font-mono-nums ${
                snapshot.netSavings < 0
                  ? 'text-[#DC4C3E] dark:text-[#F07160]'
                  : 'text-[#0E172A] dark:text-[#F4F3EE]'
              }`}
            >
              {fmt(snapshot.netSavings)}
            </p>
            <span className="text-xs font-mono-nums font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
              {snapshot.savingsRate.toFixed(1)}% saved
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
            Last month rate{' '}
            <span className="font-mono-nums">{snapshot.prevSavingsRate.toFixed(1)}%</span>
          </p>
        </div>
      </section>

      {/* 3. Cashflow Chart + Budget Health */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                Cashflow pulse
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Monthly income vs expenses over the past 6 months
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('insights')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] cursor-pointer whitespace-nowrap"
            >
              <span>Deep insights</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <CashflowBarChart data={cashflowData} />
        </div>

        {/* Budget Watchlist */}
        <div className="lg:col-span-5 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                  Budget watchlist
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Highest-utilized spending categories this month
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('budgets')}
                className="text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635] hover:underline cursor-pointer whitespace-nowrap"
              >
                All budgets
              </button>
            </div>

            <div className="space-y-4">
              {budgetSummary.slice(0, 5).map((b) => {
                const isOver = b.spent > b.limit;
                const isNear = !isOver && b.pct >= 80;
                return (
                  <div key={b.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm mb-1.5">
                      <span className="font-medium text-[#0E172A] dark:text-[#F4F3EE] truncate">
                        {b.category}
                      </span>
                      <span className="font-mono-nums text-xs text-[#475569] dark:text-[#CBD5E1] shrink-0">
                        {formatINR(b.spent)} / {formatINR(b.limit)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
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
                    {isOver && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#DC4C3E] dark:text-[#F07160]">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Over budget by {formatINR(b.spent - b.limit)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E5E2D8] dark:border-[#232B3A] flex items-center justify-between text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8]">Total monthly budget used</span>
            <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
              {snapshot.budgetUtilizationPct.toFixed(0)}% ({formatINR(snapshot.monthlyExpenses)} /{' '}
              {formatINR(snapshot.totalBudgetLimit)})
            </span>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Bills & Recent Ledger */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Bills */}
        <div className="lg:col-span-5 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                Upcoming bills
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Already reserved in your Safe-to-Spend
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('bills')}
              className="text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635] hover:underline cursor-pointer whitespace-nowrap"
            >
              View all
            </button>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-7 w-7 mx-auto text-[#65A30D] dark:text-[#A3E635] mb-2" />
              <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE]">
                All bills paid for this cycle
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                No pending recurring dues remaining this month.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE] truncate">
                      {bill.name}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      Due {formatShortDateIN(bill.dueDate)} ·{' '}
                      {bill.autoPay ? 'Auto-pay active' : 'Manual payment'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono-nums text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                      {formatINR(bill.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => markBillPaid(bill.id)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-[#E5E2D8] dark:border-[#232B3A] text-[#0E172A] dark:text-[#F4F3EE] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Mark paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-7 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                Recent activity
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Click any entry to inspect or edit
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('transactions')}
              className="text-xs font-medium text-[#4D7C0F] dark:text-[#A3E635] hover:underline cursor-pointer whitespace-nowrap"
            >
              Open ledger
            </button>
          </div>

          <div className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
            {recentTransactions.map((tx) => {
              const acc = accountMap.get(tx.accountId);
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => openEditTransaction(tx)}
                  className="w-full py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-left hover:bg-[#FAF9F5] dark:hover:bg-[#162032] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE] truncate">
                      {tx.title}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                      {tx.category} · {tx.paymentMethod}
                      {acc ? ` · ${acc.name}` : ''} · {formatShortDateIN(tx.date)}
                    </p>
                  </div>
                  <span
                    className={`font-mono-nums text-sm font-semibold shrink-0 ${
                      tx.type === 'income'
                        ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                        : 'text-[#0E172A] dark:text-[#F4F3EE]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatINR(tx.amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

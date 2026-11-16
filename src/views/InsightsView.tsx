import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_CATALOG } from '../data/seedData';
import {
  formatINR,
  getDaysInMonth,
  getPrevMonthKey,
} from '../utils/formatters';
import { DailyCumulativePoint, SpendVelocityChart } from '../components/Charts';

export function InsightsView() {
  const { transactions, budgets, currentMonthKey, snapshot } = useFinance();

  const prevMonthKey = useMemo(() => getPrevMonthKey(currentMonthKey), [currentMonthKey]);

  const currentExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthKey)),
    [transactions, currentMonthKey]
  );

  const prevExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.date.startsWith(prevMonthKey)),
    [transactions, prevMonthKey]
  );

  // Daily cumulative velocity data
  const velocityData: DailyCumulativePoint[] = useMemo(() => {
    const daysInCurrent = getDaysInMonth(currentMonthKey);
    const todayDay = new Date().getDate();

    const currByDay = new Map<number, number>();
    currentExpenses.forEach((t) => {
      const day = Number(t.date.split('-')[2]);
      currByDay.set(day, (currByDay.get(day) || 0) + t.amount);
    });

    const prevByDay = new Map<number, number>();
    prevExpenses.forEach((t) => {
      const day = Number(t.date.split('-')[2]);
      prevByDay.set(day, (prevByDay.get(day) || 0) + t.amount);
    });

    let runningCurr = 0;
    let runningPrev = 0;
    const pts: DailyCumulativePoint[] = [];

    for (let d = 1; d <= daysInCurrent; d++) {
      runningPrev += prevByDay.get(d) || 0;
      if (d <= todayDay) {
        runningCurr += currByDay.get(d) || 0;
      }
      pts.push({
        day: d,
        current: d <= todayDay ? runningCurr : null,
        previous: runningPrev,
      });
    }
    return pts;
  }, [currentExpenses, prevExpenses, currentMonthKey]);

  // 50/30/20 Breakdown
  const ruleBreakdown = useMemo(() => {
    const bucketMap = new Map(CATEGORY_CATALOG.map((c) => [c.name, c.bucket]));
    budgets.forEach((b) => bucketMap.set(b.category, b.bucket));

    let needs = 0;
    let wants = 0;
    currentExpenses.forEach((t) => {
      const bucket = bucketMap.get(t.category) || 'wants';
      if (bucket === 'needs') needs += t.amount;
      else if (bucket === 'wants') wants += t.amount;
    });

    const income = Math.max(1, snapshot.monthlyIncome);
    const savings = Math.max(0, snapshot.netSavings);

    return {
      needs,
      wants,
      savings,
      needsPct: (needs / income) * 100,
      wantsPct: (wants / income) * 100,
      savingsPct: (savings / income) * 100,
    };
  }, [currentExpenses, budgets, snapshot.monthlyIncome, snapshot.netSavings]);

  // Top Merchants
  const topMerchants = useMemo(() => {
    const map = new Map<string, { merchant: string; total: number; count: number }>();
    currentExpenses.forEach((t) => {
      const existing = map.get(t.merchant) || { merchant: t.merchant, total: 0, count: 0 };
      existing.total += t.amount;
      existing.count += 1;
      map.set(t.merchant, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [currentExpenses]);

  // Payment Channels
  const paymentChannels = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    currentExpenses.forEach((t) => {
      map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + t.amount);
      total += t.amount;
    });
    return Array.from(map.entries())
      .map(([method, amount]) => ({
        method,
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentExpenses]);

  // Projected month-end spend & computed insights
  const analytics = useMemo(() => {
    const dayOfMonth = Math.max(1, new Date().getDate());
    const daysInMonth = getDaysInMonth(currentMonthKey);
    const discretionaryExpenses = currentExpenses
      .filter((t) => t.category !== 'Housing & Rent')
      .reduce((s, t) => s + t.amount, 0);
    const rentTotal = currentExpenses
      .filter((t) => t.category === 'Housing & Rent')
      .reduce((s, t) => s + t.amount, 0);

    const dailyVariableAvg = discretionaryExpenses / dayOfMonth;
    const projectedMonthEnd = Math.round(rentTotal + dailyVariableAvg * daysInMonth);

    // Weekend vs weekday spend
    let weekendSum = 0;
    let weekendCount = 0;
    let weekdaySum = 0;
    let weekdayCount = 0;

    currentExpenses
      .filter((t) => t.category !== 'Housing & Rent')
      .forEach((t) => {
        const dt = new Date(t.date);
        const day = dt.getDay();
        if (day === 0 || day === 6) {
          weekendSum += t.amount;
          weekendCount += 1;
        } else {
          weekdaySum += t.amount;
          weekdayCount += 1;
        }
      });

    const avgWeekendTx = weekendCount > 0 ? Math.round(weekendSum / weekendCount) : 0;
    const avgWeekdayTx = weekdayCount > 0 ? Math.round(weekdaySum / weekdayCount) : 0;

    return {
      dailyVariableAvg: Math.round(dailyVariableAvg),
      projectedMonthEnd,
      avgWeekendTx,
      avgWeekdayTx,
    };
  }, [currentExpenses, currentMonthKey]);

  const overBudgetList = useMemo(() => {
    const map = new Map<string, number>();
    currentExpenses.forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return budgets
      .map((b) => ({ ...b, spent: map.get(b.category) || 0 }))
      .filter((b) => b.spent > b.limit);
  }, [budgets, currentExpenses]);

  return (
    <div className="space-y-6">
      {/* Top Row: Spending Velocity + Projected End of Month */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                Cumulative spending velocity
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Daily cumulative outflow compared against last month and your total budget ceiling
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">
                Projected month-end
              </span>
              <span className="font-mono-nums text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                {formatINR(analytics.projectedMonthEnd)}
              </span>
            </div>
          </div>

          <SpendVelocityChart data={velocityData} budgetCeiling={snapshot.totalBudgetLimit} />
        </div>

        {/* Actionable Computed Insights */}
        <div className="lg:col-span-4 rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE] mb-4">
              Money observations
            </h2>
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="pb-3 border-b border-[#E5E2D8] dark:border-[#232B3A]">
                <p className="font-semibold text-[#0E172A] dark:text-[#F4F3EE] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#4D7C0F] dark:text-[#A3E635]" />
                  Variable burn rate
                </p>
                <p className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                  Excluding rent, you spend an average of{' '}
                  <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                    {formatINR(analytics.dailyVariableAvg)}/day
                  </span>
                  . Your safe daily allowance for the rest of the month is{' '}
                  <span className="font-mono-nums font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
                    {formatINR(Math.max(0, Math.round(snapshot.dailySafeToSpend)))}/day
                  </span>
                  .
                </p>
              </div>

              <div className="pb-3 border-b border-[#E5E2D8] dark:border-[#232B3A]">
                <p className="font-semibold text-[#0E172A] dark:text-[#F4F3EE] flex items-center gap-1.5">
                  {overBudgetList.length > 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#DC4C3E] dark:text-[#F07160]" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4D7C0F] dark:text-[#A3E635]" />
                  )}
                  Budget discipline
                </p>
                <p className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                  {overBudgetList.length > 0
                    ? `${overBudgetList.map((b) => b.category).join(', ')} exceeded monthly cap by ${formatINR(
                        overBudgetList.reduce((s, b) => s + (b.spent - b.limit), 0)
                      )}.`
                    : 'All category budgets are currently within your monthly limits.'}
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                  Weekend vs weekday ticket size
                </p>
                <p className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                  Weekend transactions average{' '}
                  <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                    {formatINR(analytics.avgWeekendTx)}
                  </span>{' '}
                  versus{' '}
                  <span className="font-mono-nums font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                    {formatINR(analytics.avgWeekdayTx)}
                  </span>{' '}
                  on weekdays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Row: 50/30/20 + Top Merchants + Payment Modes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 50/30/20 Rule */}
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
            50 / 30 / 20 Split
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-5">
            Share of {formatINR(snapshot.monthlyIncome)} monthly income
          </p>

          <div className="space-y-4">
            {[
              {
                label: 'Needs (target 50%)',
                amount: ruleBreakdown.needs,
                pct: ruleBreakdown.needsPct,
                target: 50,
                barClass: 'bg-[#0E172A] dark:bg-[#94A3B8]',
              },
              {
                label: 'Wants (target 30%)',
                amount: ruleBreakdown.wants,
                pct: ruleBreakdown.wantsPct,
                target: 30,
                barClass:
                  ruleBreakdown.wantsPct > 35
                    ? 'bg-[#E05A47] dark:bg-[#F07160]'
                    : 'bg-[#64748B] dark:bg-[#475569]',
              },
              {
                label: 'Savings (target 20%+)',
                amount: ruleBreakdown.savings,
                pct: ruleBreakdown.savingsPct,
                target: 20,
                barClass: 'bg-[#65A30D] dark:bg-[#A3E635]',
              },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#0E172A] dark:text-[#F4F3EE]">{row.label}</span>
                  <span className="font-mono-nums text-[#475569] dark:text-[#CBD5E1]">
                    {row.pct.toFixed(1)}% · {formatINR(row.amount)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, row.pct)}%` }}
                    className={`h-full rounded-full ${row.barClass}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Merchants */}
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
            Top merchants
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
            Highest spend concentration this month
          </p>

          <div className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
            {topMerchants.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4">No expenses logged this month.</p>
            ) : (
              topMerchants.map((m) => (
                <div key={m.merchant} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE] truncate">
                      {m.merchant}
                    </p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {m.count} {m.count === 1 ? 'tx' : 'txns'} · avg{' '}
                      {formatINR(Math.round(m.total / m.count))}
                    </p>
                  </div>
                  <span className="font-mono-nums text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE] shrink-0">
                    {formatINR(m.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Channels */}
        <div className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6">
          <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
            Payment rails
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
            How money flows across UPI, cards &amp; bank
          </p>

          <div className="space-y-3.5">
            {paymentChannels.length === 0 ? (
              <p className="text-xs text-[#64748B]">No payment data yet.</p>
            ) : (
              paymentChannels.map((ch) => (
                <div key={ch.method}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-medium text-[#0E172A] dark:text-[#F4F3EE]">
                      {ch.method}
                    </span>
                    <span className="font-mono-nums text-[#475569] dark:text-[#CBD5E1]">
                      {ch.pct.toFixed(0)}% · {formatINR(ch.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#F3F1EA] dark:bg-[#0B111C] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, ch.pct)}%` }}
                      className="h-full rounded-full bg-[#65A30D] dark:bg-[#A3E635]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

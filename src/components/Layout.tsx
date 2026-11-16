import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ViewId } from '../types/finance';
import { formatMonthLabel } from '../utils/formatters';

interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', shortLabel: 'Ledger', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', shortLabel: 'Budgets', icon: PiggyBank },
  { id: 'goals', label: 'Savings goals', shortLabel: 'Goals', icon: Target },
  { id: 'bills', label: 'Bills & subscriptions', shortLabel: 'Bills', icon: CalendarClock },
  { id: 'insights', label: 'Insights', shortLabel: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    activeView,
    setActiveView,
    openAddTransaction,
    settings,
    toggleTheme,
    currentMonthKey,
    bills,
  } = useFinance();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeView) || NAV_ITEMS[0];
  const unpaidBillsCount = bills.filter((b) => !b.isPaidThisCycle).length;

  const handleMobileNav = (view: ViewId) => {
    setActiveView(view);
    setMobileMoreOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] dark:bg-[#0B111C] text-[#0E172A] dark:text-[#F4F3EE] transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#E5E2D8] dark:border-[#1E293B] bg-[#F3F1EA]/70 dark:bg-[#0E1523]">
        {/* Brand Wordmark */}
        <div className="h-16 flex items-center px-6 border-b border-[#E5E2D8] dark:border-[#1E293B]">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65A30D] rounded-md cursor-pointer"
          >
            <span className="h-7 w-7 rounded-md bg-[#0E172A] dark:bg-[#A3E635] text-[#FAF9F5] dark:text-[#0E172A] flex items-center justify-center font-display font-extrabold text-sm tracking-tight">
              ₹
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#0E172A] dark:text-[#F4F3EE] whitespace-nowrap">
              PaisaFlow
            </span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE] shadow-xs border border-[#E5E2D8] dark:border-[#232B3A]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] hover:bg-[#EAE7DC]/60 dark:hover:bg-[#141D2D]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                        : 'text-[#64748B] dark:text-[#94A3B8]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'bills' && unpaidBillsCount > 0 && (
                  <span className="text-xs font-mono-nums text-[#64748B] dark:text-[#94A3B8]">
                    {unpaidBillsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Profile & Theme Toggle */}
        <div className="p-4 border-t border-[#E5E2D8] dark:border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE] truncate">
                {settings.userName}
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                {settings.personaLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] bg-[#FFFFFF] dark:bg-[#121A28] text-[#475569] dark:text-[#CBD5E1] hover:text-[#0E172A] dark:hover:text-[#F4F3EE] transition-colors cursor-pointer shrink-0"
              aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {settings.theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-[#E5E2D8] dark:border-[#1E293B] bg-[#FAF9F5]/90 dark:bg-[#0B111C]/90 backdrop-blur-md">
          <div className="h-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
            {/* Left: Mobile wordmark or Desktop breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="lg:hidden h-7 w-7 rounded-md bg-[#0E172A] dark:bg-[#A3E635] text-[#FAF9F5] dark:text-[#0E172A] flex items-center justify-center font-display font-extrabold text-sm shrink-0"
                aria-label="PaisaFlow home"
              >
                ₹
              </button>
              <div className="flex items-baseline gap-2.5 min-w-0">
                <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0E172A] dark:text-[#F4F3EE] truncate">
                  {currentNav.label}
                </h1>
                <span className="hidden sm:inline text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                  · {formatMonthLabel(currentMonthKey)}
                </span>
              </div>
            </div>

            {/* Right: Primary Action (+ mobile theme toggle) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="lg:hidden p-2 rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] text-[#475569] dark:text-[#CBD5E1]"
                aria-label="Toggle theme"
              >
                {settings.theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={openAddTransaction}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#84CC16] hover:bg-[#65A30D] dark:bg-[#A3E635] dark:hover:bg-[#BEF264] text-[#0E172A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Add transaction</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation with Prominent Quick-Add */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-[#E5E2D8] dark:border-[#1E293B] bg-[#FAF9F5]/95 dark:bg-[#0E1523]/95 backdrop-blur-md px-2"
        aria-label="Mobile navigation"
      >
        <div className="h-full max-w-md mx-auto grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => handleMobileNav('overview')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
              activeView === 'overview'
                ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                : 'text-[#64748B] dark:text-[#94A3B8]'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('transactions')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
              activeView === 'transactions'
                ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                : 'text-[#64748B] dark:text-[#94A3B8]'
            }`}
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span>Ledger</span>
          </button>

          {/* Prominent Quick-Add Action */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={openAddTransaction}
              className="-mt-4 h-12 w-12 rounded-full bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] shadow-md border-4 border-[#FAF9F5] dark:border-[#0B111C] flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Quick add transaction"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleMobileNav('budgets')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
              activeView === 'budgets'
                ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                : 'text-[#64748B] dark:text-[#94A3B8]'
            }`}
          >
            <PiggyBank className="h-5 w-5" />
            <span>Budgets</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMoreOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
              ['goals', 'bills', 'insights', 'settings'].includes(activeView) || mobileMoreOpen
                ? 'text-[#4D7C0F] dark:text-[#A3E635]'
                : 'text-[#64748B] dark:text-[#94A3B8]'
            }`}
          >
            {mobileMoreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Sheet */}
      {mobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-[#0E172A]/40"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 bg-[#FFFFFF] dark:bg-[#121A28] border-t border-[#E5E2D8] dark:border-[#232B3A] rounded-t-2xl p-4 space-y-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pb-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              More sections
            </p>
            {NAV_ITEMS.filter((n) =>
              ['goals', 'bills', 'insights', 'settings'].includes(n.id)
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMobileNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#F3F1EA] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE]'
                      : 'text-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#4D7C0F] dark:text-[#A3E635]" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'bills' && unpaidBillsCount > 0 && (
                    <span className="text-xs font-mono-nums text-[#64748B] dark:text-[#94A3B8]">
                      {unpaidBillsCount} due
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
